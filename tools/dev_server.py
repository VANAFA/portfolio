#!/usr/bin/env python3
"""Local dev server for in-browser editing of the site.

This is the LOCAL-ONLY companion to js/devedit.js. It does two things a plain
`python3 -m http.server` can't:

  1. Serves the site statically (exactly like serve.sh used to), AND
  2. Exposes a tiny write API under /__dev/ so the browser can save an inline
     text edit back to the real source file, and trigger ./deploy.sh.

It is NEVER part of the deployed site. The production host only ever serves the
static files; these endpoints simply don't exist there, and js/devedit.js stays
completely inert unless it can reach /__dev/ping on localhost (see that file).

Run it via ./serve.sh (which now calls this instead of http.server).

--------------------------------------------------------------------------------
DOM -> source-file mapping (how a saved edit finds its place on disk)
--------------------------------------------------------------------------------
The browser sends one of two kinds of save request. Both are deliberately strict
and refuse to write anything ambiguous, so a source file can never be corrupted:

  * kind "i18n": for elements carrying data-i18n="some.key" (most visible text on
    the site). We rewrite the single string literal for that key, for the current
    language, inside js/i18n.js's STRINGS table. The match is anchored on
    `"some.key":` within the correct `en:` / `es:` block, so it is exact.

  * kind "html": for plain text elements with no data-i18n. The browser sends the
    element's ORIGINAL text (captured before editing) and the new text, plus the
    page file (e.g. index.html). We replace the original text ONLY IF it occurs
    exactly once in that file. Zero or 2+ occurrences => refused, so we never
    guess which one the user meant.

Anything driven by js/data.js (project blog copy) is intentionally not editable
this way - see js/devedit.js for why - so those elements are not offered for
editing and never reach this server.
"""

import json
import os
import re
import subprocess
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Repo root = the website/ dir (this file lives in website/tools/).
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Files a save is ever allowed to touch. Anything else is rejected outright so a
# crafted request can't wander outside the site or into build/deploy scripts.
ALLOWED_HTML = {"index.html", "blog.html", "travel.html"}
I18N_FILE = os.path.join("js", "i18n.js")


def _abs_in_root(rel):
    """Resolve rel against ROOT and confirm it stays inside ROOT (no ../ escape)."""
    full = os.path.realpath(os.path.join(ROOT, rel))
    if full != ROOT and not full.startswith(ROOT + os.sep):
        raise ValueError("path escapes site root: %r" % rel)
    return full


def _js_escape(s):
    """Escape a Python string for a double-quoted JS string literal.

    i18n.js stores every string in double quotes; we only ever emit that form so
    the replacement round-trips cleanly.
    """
    out = []
    for ch in s:
        if ch == "\\":
            out.append("\\\\")
        elif ch == '"':
            out.append('\\"')
        elif ch == "\n":
            out.append("\\n")
        elif ch == "\r":
            out.append("\\r")
        elif ch == "\t":
            out.append("\\t")
        else:
            out.append(ch)
    return "".join(out)


def _lang_block_span(text, lang):
    """Return (start, end) char offsets of the `lang: { ... }` object body in
    i18n.js's STRINGS table, or None. `lang` is "en" or "es".

    Matches the `en: {` / `es: {` opener, then walks braces to find its matching
    close so we only ever edit within the right language block.
    """
    m = re.search(r"\b%s\s*:\s*\{" % re.escape(lang), text)
    if not m:
        return None
    i = m.end()  # just after the opening {
    depth = 1
    while i < len(text) and depth > 0:
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        i += 1
    if depth != 0:
        return None
    return (m.end(), i - 1)  # body between the braces


def _save_i18n(key, lang, new_text):
    """Rewrite STRINGS[lang][key] in js/i18n.js. Returns (ok, message)."""
    if lang not in ("en", "es"):
        return False, "unknown language %r" % lang
    path = _abs_in_root(I18N_FILE)
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    span = _lang_block_span(text, lang)
    if not span:
        return False, "could not locate %s: {...} block in i18n.js" % lang
    start, end = span
    block = text[start:end]

    # Match  "key": "value"  (double-quoted value, standard for this table).
    # Value body allows escaped chars; stops at the first unescaped closing quote.
    pat = re.compile(
        r'("%s"\s*:\s*)"((?:\\.|[^"\\])*)"' % re.escape(key)
    )
    m = pat.search(block)
    if not m:
        return False, (
            "key %r not found as a double-quoted string in the %s block "
            "(only plain double-quoted i18n values are editable)" % (key, lang)
        )
    # Guard against ambiguity: the key must appear exactly once in the block.
    if pat.search(block, m.end()):
        return False, "key %r appears more than once in the %s block" % (key, lang)

    replacement = m.group(1) + '"' + _js_escape(new_text) + '"'
    new_block = block[:m.start()] + replacement + block[m.end():]
    new_full = text[:start] + new_block + text[end:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_full)
    return True, "updated i18n key %r (%s)" % (key, lang)


def _save_html(page, original, new_text):
    """Replace `original` text with `new_text` in `page`, only if unique.

    Returns (ok, message). Refuses on 0 or >1 occurrences so we never corrupt a
    file or edit the wrong copy.
    """
    if page not in ALLOWED_HTML:
        return False, "page %r is not editable" % page
    if original is None or original == "":
        return False, "missing original text to match"
    path = _abs_in_root(page)
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    count = text.count(original)
    if count == 0:
        return False, (
            "original text not found verbatim in %s (whitespace/markup may "
            "differ); not saved" % page
        )
    if count > 1:
        return False, (
            "original text appears %d times in %s - too ambiguous to save "
            "safely" % (count, page)
        )
    new_full = text.replace(original, new_text, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_full)
    return True, "updated text in %s" % page


def _run_deploy():
    """Run ./deploy.sh and capture its output. Returns (ok, combined_output)."""
    script = _abs_in_root("deploy.sh")
    try:
        proc = subprocess.run(
            ["bash", script],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=600,
        )
    except Exception as e:  # noqa: BLE001 - surface anything back to the browser
        return False, "failed to launch deploy.sh: %s" % e
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode == 0, out


class DevHandler(SimpleHTTPRequestHandler):
    # Serve files out of ROOT regardless of the process CWD.
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Local dev only: never cache static assets, so an edit always shows on
        # reload without having to bump each file's ?v= query. (Production is a
        # plain static host; this server is never deployed.) The /__dev/ JSON
        # API sets its own Cache-Control in _send_json, so skip those here to
        # avoid emitting the header twice.
        if not self.path.startswith("/__dev/"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Keep the console readable: only note the dev API, not every asset.
        if self.path.startswith("/__dev/"):
            sys.stderr.write("[dev] %s %s\n" % (self.command, self.path))

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # No-store: dev responses must never be cached.
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__dev/ping":
            # Handshake so js/devedit.js knows a writable dev server is present.
            self._send_json(HTTPStatus.OK, {"dev": True})
            return
        super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if not path.startswith("/__dev/"):
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "not found"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except (ValueError, UnicodeDecodeError):
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "invalid JSON"})
            return

        try:
            if path == "/__dev/save":
                kind = payload.get("kind")
                new_text = payload.get("newText", "")
                if kind == "i18n":
                    ok, msg = _save_i18n(
                        payload.get("key", ""),
                        payload.get("lang", "en"),
                        new_text,
                    )
                elif kind == "html":
                    ok, msg = _save_html(
                        payload.get("page", ""),
                        payload.get("original", ""),
                        new_text,
                    )
                else:
                    ok, msg = False, "unknown save kind %r" % kind
                self._send_json(
                    HTTPStatus.OK if ok else HTTPStatus.CONFLICT,
                    {"ok": ok, "message": msg},
                )
                return

            if path == "/__dev/deploy":
                ok, out = _run_deploy()
                self._send_json(
                    HTTPStatus.OK if ok else HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"ok": ok, "output": out},
                )
                return
        except ValueError as e:  # path-escape or similar hard reject
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(e)})
            return
        except Exception as e:  # noqa: BLE001
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(e)}
            )
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "unknown endpoint"})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # Bind to localhost only - the write API must never be reachable off-machine.
    server = ThreadingHTTPServer(("127.0.0.1", port), DevHandler)
    print("Dev server (editable) on http://localhost:%d  (Ctrl+C to stop)" % port)
    print("Serving %s  -  inline editing + deploy enabled locally only" % ROOT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        server.server_close()


if __name__ == "__main__":
    main()
