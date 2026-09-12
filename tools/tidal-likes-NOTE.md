# Refreshing your Tidal likes in the "Music" window

The Music window on the desktop picks a random track from
`js/tidalsongs.js` (`window.TIDAL_SONGS`). Tidal has **no public
read-only API a static browser page can call**, so that file isn't a live
feed — it's generated from your account and committed as plain data.

`tools/scrape_tidal.py` does the generating: it logs in with an OAuth
access token from your own Tidal session (never a password), reads your
**Favourites → Tracks**, and rewrites `js/tidalsongs.js`. Re-run it
whenever your likes change.

## Each entry's shape (what the scraper writes)

```js
{
  "title":  "Song title",            // required
  "artist": "Artist name",           // required
  "art":    "https://resources.tidal.com/images/.../640x640.jpg"  // required
}
```

## How to refresh

1. **Get an access token.** Open <https://tidal.com> logged in, open
   DevTools → Network (filter to XHR / `api.tidal.com`), reload, click any
   authorized request (e.g. `/v1/sessions`, `/v1/favorites/...` — *not*
   `/v1/ping`, which is public) and copy the `Authorization: Bearer eyJ…`
   token. Or, in the Console:
   ```js
   (() => { for (const s of [localStorage, sessionStorage]) for (const k in s) { const m=(s[k]||"").match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/); if (m) return m[0]; } })()
   ```
   The token is short-lived (a few hours), so treat it as disposable.

2. **Run the scraper** with the venv that has `tidalapi` installed. Pass the
   token without persisting it in the repo, e.g. via the environment:
   ```sh
   TIDAL_TOKEN='Bearer eyJ...' \
     /media/vanafa/1TB/Workspace/cv/.venv-tidal/bin/python tools/scrape_tidal.py
   ```
   It also accepts the token as `argv[1]` (a file path) or from
   `/media/vanafa/1TB/Workspace/cv/.tidal_token` (that path is outside the
   git repo, so it can never be committed).

3. **That's it.** `js/tidalsongs.js` is rewritten with all your current
   likes; the Music window picks from them automatically. No other file
   changes.

> One-time venv setup, if it's gone:
> `python3 -m venv /media/vanafa/1TB/Workspace/cv/.venv-tidal && /media/vanafa/1TB/Workspace/cv/.venv-tidal/bin/pip install tidalapi`
