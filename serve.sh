#!/usr/bin/env bash
# Local preview server. Run this and test in a browser before ./deploy.sh —
# this is the "dev build": every feature is visible here, including ones
# js/features.js hides on the live site (see README's "Hiding a work-in-
# progress feature" section).
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-8000}"
echo "Serving on http://localhost:$PORT (Ctrl+C to stop)"
python3 -m http.server "$PORT"
