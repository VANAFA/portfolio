#!/usr/bin/env python3
"""
Generates the two derived sizes each desktop background needs, from the
original photos dropped in images/bgs/:

  images/bgs/optimized/<name>.jpg   max 1920px on the long edge - used as the
                                     actual applied wallpaper
  images/bgs/thumbs/<name>.jpg      max 220px wide - used in the "My Computer"
                                     picker so it doesn't have to load full
                                     photos just to preview them

Run it after adding a new photo to images/bgs/, then add one entry to
js/backgrounds.js pointing at the new file.

    python3 tools/make_bg_variants.py
"""
from pathlib import Path
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent.parent
SRC_DIR = HERE / "images" / "bgs"
OPT_DIR = SRC_DIR / "optimized"
THUMB_DIR = SRC_DIR / "thumbs"

OPT_MAX = 1920
THUMB_MAX_W = 220


def make_variant(src_path, out_path, max_dim, is_thumb):
    im = ImageOps.exif_transpose(Image.open(src_path)).convert("RGB")
    if is_thumb:
        ratio = max_dim / im.width
    else:
        ratio = min(1.0, max_dim / max(im.size))
    if ratio < 1.0:
        im = im.resize((max(1, round(im.width * ratio)), max(1, round(im.height * ratio))), Image.LANCZOS)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, "JPEG", quality=82, optimize=True)
    return out_path.stat().st_size


def main():
    OPT_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(
        p for p in SRC_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png")
    )
    if not sources:
        print(f"No source images found in {SRC_DIR}")
        return
    for src in sources:
        stem = src.stem
        opt_size = make_variant(src, OPT_DIR / f"{stem}.jpg", OPT_MAX, is_thumb=False)
        thumb_size = make_variant(src, THUMB_DIR / f"{stem}.jpg", THUMB_MAX_W, is_thumb=True)
        print(f"{src.name}: {src.stat().st_size/1e6:.1f}MB -> "
              f"optimized {opt_size/1e6:.2f}MB, thumb {thumb_size/1e3:.0f}KB")


if __name__ == "__main__":
    main()
