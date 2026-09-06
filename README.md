# valentino.cv — Windows 98 portfolio site

A tiny, dependency-free static site (no build step, no framework) styled like
Windows 98. Open `index.html` directly in a browser, or host the folder as-is
on any static host (GitHub Pages, Netlify, etc.).

## Adding a new project / blog post

Everything lives in one place: **`js/data.js`**.

1. Open `js/data.js`.
2. Copy one of the existing objects in the `PROJECTS` array and paste it as a
   new entry.
3. Fill in:
   - `id` — a unique slug (letters/numbers/dashes only), used in the URL as
     `blog.html?id=your-id`.
   - `title`, `glyph` (path to an icon in `images/icons/`), `tagline`, `tech` (tag list).
   - `summary` — short paragraph shown in the pop-up window.
   - `images` — paths to screenshots/photos (drop files into `images/`).
   - `blog` — an array of strings, one per paragraph, for the full write-up.
   - `links` — optional extra buttons (e.g. GitHub repo, live demo).
4. Save the file.

That's it — no other file needs to change:

- The new project's icon appears automatically in the "My Projects" list on
  `index.html`.
- Clicking it opens the pop-up with your summary/photos and a
  "To know more →" link.
- That link opens `blog.html?id=your-id`, which is a single shared template
  (`blog.html` + `js/blog.js`) that renders itself from the same `data.js`
  entry — so every project gets its own working subpage for free.

## Structure

```
index.html        Home page: about me + auto-generated project list + contact
blog.html          Shared template for every project's blog subpage
css/win98.css      All the Windows 98 styling
js/data.js         <-- the file you edit to add/change projects
js/main.js         Renders the project grid + pop-up on index.html
js/blog.js         Renders a blog.html?id=... page from data.js
js/windows.js      Minimize/maximize/close + taskbar buttons for each window
js/taskbar.js      Decorative taskbar clock
images/icons/      Real Windows 98 .ico icons used across the site
images/            Photos/screenshots referenced from data.js
```

## Windows behave like real windows

Every top-level window (About Me, My Projects, Contact, Project Blog) has
working minimize/maximize/close buttons and a matching button in the taskbar
at the bottom of the screen:

- **Minimize (_)** or **Close (✕)** hides the window; its taskbar button stays
  so you can click it again to bring the window back.
- **Maximize (□)** expands the window to fill the screen; click it again to
  restore.
- **Start** always goes back to `index.html`.

This is handled generically by `js/windows.js` for any `.window` element that
has a `data-window="some-id"` attribute — add that attribute to a new window
section and it gets minimize/maximize/close + a taskbar button for free.

## Replacing the placeholder images

`images/placeholder-*.png` are stand-ins for project screenshots. Drop real
screenshots/photos into `images/` and point each project's `images` array at
them in `js/data.js`.

## Editing your name/bio/contact info

Those are plain HTML in `index.html` (the "About Me" and "Contact" windows)
and duplicated in the "Contact" window of `blog.html`. Edit the text directly.
