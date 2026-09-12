/*
 * Local-only inline editor ("dev mode").
 *
 * WHAT IT DOES (only when running locally, never on the live site):
 *   - Double-click most visible text on the page to edit it in place.
 *   - Click away / blur commits the edit and saves it straight to the SOURCE
 *     file on disk (js/i18n.js for translated text, or the .html file for plain
 *     text) via the local dev server's /__dev/save endpoint.
 *   - A little win98 "Dev" toolbar shows a "Commit & Deploy" button that runs
 *     the existing ./deploy.sh through /__dev/deploy - it always deploys the
 *     real production site, never this dev tooling (the tooling isn't active in
 *     production at all).
 *
 * WHY IT'S SAFE FOR PRODUCTION:
 *   Two independent gates, both must pass before ANY affordance appears:
 *     1. Host check - same rule js/features.js uses (localhost / 127.0.0.1 /
 *        ::1 / *.local / file:). On the deployed domain we bail immediately.
 *     2. Server handshake - we GET /__dev/ping. Only the local dev server
 *        (tools/dev_server.py, started by serve.sh) answers it; a plain static
 *        host 404s, so we bail. This means even opening the files over file://
 *        or against `python3 -m http.server` leaves the page completely inert:
 *        no listeners, no toolbar, no extra requests beyond the single ping.
 *
 * HOW A DOM EDIT MAPS BACK TO A SOURCE FILE (see tools/dev_server.py for the
 * write side):
 *   - Elements with data-i18n="key": we send {kind:"i18n", key, lang} and the
 *     server rewrites that one string in js/i18n.js for the current language.
 *     This is the common case (nearly all UI text) and is an exact key match.
 *   - Plain text elements with no data-i18n: we send {kind:"html", page,
 *     original, newText}; the server replaces `original` in that .html file
 *     only if it appears exactly once (otherwise it refuses - never corrupts).
 *
 * DELIBERATELY NOT EDITABLE (deferred): text rendered from js/data.js (project
 * blog copy), because it lives in per-language nested objects that are risky to
 * string-match safely, and anything inside dynamically-rendered regions. Those
 * elements are simply not made editable, so no unsafe write is ever attempted.
 */
(function () {
  "use strict";

  var isLocal =
    location.protocol === "file:" ||
    location.hostname === "" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]" ||
    location.hostname.endsWith(".local");

  if (!isLocal) return; // Gate 1: never touch the live site.

  // Gate 2: confirm a writable dev server is actually here before doing anything.
  fetch("/__dev/ping", { cache: "no-store" })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      if (data && data.dev) init();
    })
    .catch(function () {
      /* No dev server (e.g. file:// or plain http.server): stay fully inert. */
    });

  // Regions whose text is rendered from js/data.js or otherwise generated at
  // runtime - not safely mappable back to a single source literal, so skip them.
  var SKIP_SELECTOR =
    "#project-grid, #blog-root, #travel-root, #travel-content, " +
    "#travel-entry-root, #chat-messages, #leaderboard-root, #taskbar-windows, " +
    "#desktop-icons, #bg-grid, #music-root, script, style, textarea, input, [contenteditable]";

  // Tags whose direct text we allow editing. We only edit an element that has a
  // single text child (no nested elements) so we never scramble inline markup.
  var EDITABLE_TAGS = {
    P: 1, H1: 1, H2: 1, H3: 1, H4: 1, SPAN: 1, STRONG: 1, EM: 1,
    LI: 1, DIV: 1, A: 1, BUTTON: 1, LABEL: 1, TD: 1, TH: 1, SMALL: 1, B: 1,
  };

  var PAGE = (location.pathname.split("/").pop() || "index.html") || "index.html";
  if (!/\.html$/.test(PAGE)) PAGE = "index.html";

  function hasOnlyText(el) {
    if (!el.firstChild) return false;
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType !== 3) return false; // only text nodes
    }
    return el.textContent.trim().length > 0;
  }

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (!EDITABLE_TAGS[el.tagName]) return false;
    if (el.closest(SKIP_SELECTOR)) return false;
    // Don't edit window-control glyphs, the start button label, etc. that are
    // structural rather than content - require it to be plain-text-only.
    return hasOnlyText(el);
  }

  function post(endpoint, body) {
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (j) {
        return { status: r.status, body: j };
      });
    });
  }

  var toast;
  function showToast(msg, ok) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.color = ok ? "#000080" : "#a00000";
    toast.style.opacity = "1";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.style.opacity = "0";
    }, 4000);
  }

  function beginEdit(el) {
    if (el.getAttribute("data-dev-editing") === "1") return;
    var original = el.textContent;
    el.setAttribute("data-dev-editing", "1");
    el.setAttribute("data-dev-original", original);
    el.setAttribute("contenteditable", "plaintext-only");
    // Some browsers don't support plaintext-only; fall back to true.
    if (el.getAttribute("contenteditable") !== "plaintext-only") {
      el.setAttribute("contenteditable", "true");
    }
    el.classList.add("dev-editing");
    el.focus();

    // Select all the current text for quick replacement.
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);

    function finish() {
      el.removeEventListener("blur", finish);
      el.removeEventListener("keydown", onKey);
      el.removeAttribute("contenteditable");
      el.classList.remove("dev-editing");
      el.setAttribute("data-dev-editing", "0");

      var newText = el.textContent;
      if (newText === original) {
        el.removeAttribute("data-dev-original");
        return; // nothing changed
      }

      var i18nKey = el.getAttribute("data-i18n");
      var body;
      if (i18nKey) {
        body = {
          kind: "i18n",
          key: i18nKey,
          lang: (window.getLang && window.getLang()) || "en",
          newText: newText,
        };
      } else {
        body = {
          kind: "html",
          page: PAGE,
          original: original,
          newText: newText,
        };
      }

      showToast("Saving…", true);
      post("/__dev/save", body)
        .then(function (res) {
          if (res.body && res.body.ok) {
            showToast("Saved: " + (res.body.message || "ok"), true);
          } else {
            // Revert the DOM so the page reflects what's actually on disk.
            el.textContent = original;
            showToast(
              "Not saved: " + ((res.body && res.body.message) || "error"),
              false
            );
          }
        })
        .catch(function (e) {
          el.textContent = original;
          showToast("Save failed: " + e, false);
        })
        .then(function () {
          el.removeAttribute("data-dev-original");
        });
    }

    function onKey(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        el.blur(); // commit
      } else if (e.key === "Escape") {
        e.preventDefault();
        el.textContent = original; // cancel
        el.blur();
      }
    }

    el.addEventListener("blur", finish);
    el.addEventListener("keydown", onKey);
  }

  function onDblClick(e) {
    var el = e.target;
    // Walk up to the nearest editable text element (e.g. dblclick on a text node).
    while (el && el !== document.body && !isEditable(el)) {
      el = el.parentElement;
    }
    if (el && isEditable(el)) {
      e.preventDefault();
      beginEdit(el);
    }
  }

  function buildToolbar() {
    var bar = document.createElement("div");
    bar.className = "dev-toolbar raised";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Dev editing toolbar");

    var label = document.createElement("span");
    label.className = "dev-toolbar-label";
    label.textContent = "🔧 Dev - double-click text to edit";

    var deployBtn = document.createElement("button");
    deployBtn.type = "button";
    deployBtn.className = "btn98";
    deployBtn.textContent = "Commit & Deploy";

    toast = document.createElement("span");
    toast.className = "dev-toolbar-toast";
    toast.style.transition = "opacity .3s";
    toast.style.opacity = "0";

    deployBtn.addEventListener("click", function () {
      if (
        !window.confirm(
          "Run ./deploy.sh?\n\nThis stamps assets, commits, and PUSHES the " +
            "production site to GitHub. The dev tooling is not part of what " +
            "ships. Continue?"
        )
      ) {
        return;
      }
      deployBtn.disabled = true;
      var prev = deployBtn.textContent;
      deployBtn.textContent = "Deploying…";
      showToast("Running deploy.sh…", true);
      post("/__dev/deploy", {})
        .then(function (res) {
          if (res.body && res.body.ok) {
            showToast("Deployed ✓", true);
            console.log("[dev] deploy output:\n" + (res.body.output || ""));
          } else {
            showToast("Deploy failed - see console", false);
            console.error(
              "[dev] deploy failed:\n" +
                ((res.body && (res.body.output || res.body.error)) || "")
            );
          }
        })
        .catch(function (e) {
          showToast("Deploy request failed: " + e, false);
        })
        .then(function () {
          deployBtn.disabled = false;
          deployBtn.textContent = prev;
        });
    });

    bar.appendChild(label);
    bar.appendChild(deployBtn);
    bar.appendChild(toast);
    document.body.appendChild(bar);
  }

  function init() {
    document.addEventListener("dblclick", onDblClick, true);
    if (document.body) {
      buildToolbar();
    } else {
      document.addEventListener("DOMContentLoaded", buildToolbar);
    }
    console.log(
      "[dev] Inline editing enabled. Double-click text to edit; click away to " +
        "save to the source file."
    );
  }
})();
