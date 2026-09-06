#!/usr/bin/env bash
# Deploy helper.
#
# Stamps every CSS/JS reference in the HTML with ?v=<commit>, so a browser can
# never serve a stale script or stylesheet alongside fresh HTML, and updates the
# version badge to match. Run it after committing your changes:
#
#     ./deploy.sh
#
# It creates one extra commit ("Stamp assets ...") and pushes.
set -euo pipefail
cd "$(dirname "$0")"

STAMP=$(git rev-parse --short HEAD)
UPDATED=$(date -u +"%Y-%m-%d %H:%M UTC")

python3 - "$STAMP" "$UPDATED" <<'PY'
import re, sys, pathlib

stamp, updated = sys.argv[1], sys.argv[2]

for name in ("index.html", "blog.html"):
    p = pathlib.Path(name)
    s = p.read_text()
    # (re)stamp local css/js references, leaving external URLs alone
    s = re.sub(r'(href="css/[^"?]+\.css)(\?v=[^"]*)?"', rf'\1?v={stamp}"', s)
    s = re.sub(r'(src="js/[^"?]+\.js)(\?v=[^"]*)?"', rf'\1?v={stamp}"', s)
    p.write_text(s)
    print(f"stamped {name} -> {stamp}")

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
  git add index.html blog.html js/version.js
  git commit -q -m "Stamp assets and version badge as $STAMP"
  echo "committed stamp $STAMP"
fi

git push
echo "pushed. badge will read: v: $STAMP"
