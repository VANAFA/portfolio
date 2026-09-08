#!/usr/bin/env bash
# Deploy helper.
#
# Stamps asset references so a browser can never serve a stale file alongside
# fresh HTML:
#   * CSS/JS get ?v=<commit>       - they change together with the markup
#   * images get ?v=<content hash> - only images that actually changed bust,
#                                    so swapping one photo doesn't force a
#                                    re-download of all the others
#
# It also updates the version badge, then commits and pushes. Run it after
# committing your changes:
#
#     ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

STAMP=$(git rev-parse --short HEAD)
UPDATED=$(date -u +"%Y-%m-%d %H:%M UTC")

python3 - "$STAMP" "$UPDATED" <<'PY'
import hashlib, re, sys, pathlib

stamp, updated = sys.argv[1], sys.argv[2]
hash_cache = {}

def content_hash(rel_path):
    """Short hash of a file's bytes, so its URL changes only when it does."""
    if rel_path in hash_cache:
        return hash_cache[rel_path]
    f = pathlib.Path(rel_path)
    h = hashlib.md5(f.read_bytes()).hexdigest()[:8] if f.is_file() else None
    hash_cache[rel_path] = h
    return h

IMG_RE = re.compile(r'(images/[A-Za-z0-9_./-]+?\.(?:png|jpg|jpeg|gif|svg|ico|webp))(\?v=[^"\')\s]*)?')

def stamp_images(text):
    def repl(m):
        path = m.group(1)
        h = content_hash(path)
        return f"{path}?v={h}" if h else path
    return IMG_RE.sub(repl, text)

# HTML: css/js by commit, images by content
for name in ("index.html", "blog.html", "travel.html"):
    p = pathlib.Path(name)
    s = p.read_text()
    s = re.sub(r'(href="css/[^"?]+\.css)(\?v=[^"]*)?"', rf'\1?v={stamp}"', s)
    s = re.sub(r'(src="js/[^"?]+\.js)(\?v=[^"]*)?"', rf'\1?v={stamp}"', s)
    s = stamp_images(s)
    p.write_text(s)
    print(f"stamped {name}")

# data.js references images too (project icons and previews)
d = pathlib.Path("js/data.js")
d.write_text(stamp_images(d.read_text()))
print("stamped js/data.js image paths")

v = pathlib.Path("js/version.js")
s = v.read_text()
s = re.sub(r'hash: "[^"]*"', f'hash: "{stamp}"', s)
s = re.sub(r'updated: "[^"]*"', f'updated: "{updated}"', s)
s = re.sub(r'commit/[^"]*"', f'commit/{stamp}"', s)
v.write_text(s)
print(f"version badge -> {stamp}")
PY

if git diff --quiet; then
  echo "nothing to stamp"
else
  git add index.html blog.html travel.html js/data.js js/version.js
  git commit -q -m "Stamp assets and version badge as $STAMP"
  echo "committed stamp $STAMP"
fi

git push
echo "pushed. badge will read: v: $STAMP"
