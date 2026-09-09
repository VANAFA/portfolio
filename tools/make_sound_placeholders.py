#!/usr/bin/env python3
"""
Creates one tiny silent placeholder MP3 per sound effect in sounds/, ready to
be overwritten with a real recording under the same filename.

js/sfx.js checks each file's size at load time: anything at or below
PLACEHOLDER_MAX_BYTES is treated as "not replaced yet" and falls back to the
synthesised Web Audio sound; anything bigger is assumed to be a real
recording and gets played instead. Keep that constant in sync with this
script if you change the placeholder duration/bitrate.

Requires ffmpeg. Run again any time you want to reset a sound back to the
placeholder.

    python3 tools/make_sound_placeholders.py
"""
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
OUT_DIR = HERE / "sounds"

# One per window.SFX method in js/sfx.js.
EFFECTS = [
    "pick", "drop", "chew", "swallow", "hit", "speak", "burp",
    "place", "invalid", "shuffle", "win", "click",
]

DURATION_S = "0.3"
BITRATE = "8k"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in EFFECTS:
        out_path = OUT_DIR / f"{name}.mp3"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                "-t", DURATION_S, "-b:a", BITRATE,
                str(out_path),
            ],
            check=True,
        )
        print(f"{out_path.name}: {out_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
