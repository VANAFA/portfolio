#!/usr/bin/env bash
# Local preview server. Run this and test in a browser before ./deploy.sh —
# this is the "dev build": every feature is visible here, including ones
# js/features.js hides on the live site (see README's "Hiding a work-in-
# progress feature" section).
#
# It runs tools/dev_server.py, a stdlib-only Python server that serves the site
# exactly like `python3 -m http.server` did, plus a small local-only write API
# (/__dev/*) that powers in-browser inline editing and the "Commit & Deploy"
# button (js/devedit.js). Those endpoints exist ONLY here; the deployed site is
# still a pure static site and js/devedit.js stays inert unless it can reach
# this server on localhost. See tools/dev_server.py for the details.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8000}"
echo "Serving on http://localhost:$PORT (Ctrl+C to stop)"
exec python3 tools/dev_server.py "$PORT"
