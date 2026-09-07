/*
 * ============================================================
 *  DESKTOP BACKGROUNDS — add a photo here to make it selectable
 *  from the "My Computer" window.
 *
 *  1. Drop the original photo into images/bgs/.
 *  2. Run: python3 tools/make_bg_variants.py
 *     (generates a resized "optimized" copy used as the actual
 *     wallpaper, and a small "thumb" used in the picker, so
 *     multi-megabyte photos never get downloaded just to preview
 *     them).
 *  3. Add one entry below - id, en/es label, and the two paths
 *     the script just created.
 *
 *  The first entry (full: null) is the default teal desktop and
 *  must stay first.
 * ============================================================
 */
window.BACKGROUNDS = [
  { id: "default", en: "Classic Teal", es: "Verde Clásico", full: null, thumb: null },
  { id: "angel", en: "Angel", es: "Angel",
    full: "images/bgs/optimized/Angel.jpg", thumb: "images/bgs/thumbs/Angel.jpg" },
  { id: "boca", en: "Boca", es: "Boca",
    full: "images/bgs/optimized/Boca.jpg", thumb: "images/bgs/thumbs/Boca.jpg" },
  { id: "gundam", en: "Gundam", es: "Gundam",
    full: "images/bgs/optimized/Gundam.jpg", thumb: "images/bgs/thumbs/Gundam.jpg" },
  { id: "girasoles", en: "Sunflowers", es: "Girasoles",
    full: "images/bgs/optimized/girasoles.jpg", thumb: "images/bgs/thumbs/girasoles.jpg" }
];
