#!/usr/bin/env python3
"""
Scrape the user's Tidal "Favourites -> Tracks" into js/tidalsongs.js.

Tidal has no public read-only API, so this authenticates with the user's own
account via an OAuth access token they supply (nothing here ever handles a
password). Run it with the venv that has `tidalapi` installed, e.g.:

    /media/vanafa/1TB/Workspace/cv/.venv-tidal/bin/python tools/scrape_tidal.py

Where the token comes from (priority order):
  1. A path given as argv[1].
  2. $TIDAL_TOKEN.
  3. The file /media/vanafa/1TB/Workspace/cv/.tidal_token  (outside the git
     repo, so it can never be committed).

The token source may be EITHER:
  * a raw OAuth access token string ("eyJ...", optionally prefixed "Bearer "), or
  * a JSON object with any of:
        {"access_token": "...", "token_type": "Bearer",
         "refresh_token": "...", "expiry_time": "..."}
    (a tidalapi session export works as-is).

It writes ALL favourited tracks (title, artist, 640px album art) to
js/tidalsongs.js, replacing whatever is there.
"""
import json
import os
import sys

import tidalapi

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # .../website
OUT = os.path.join(REPO, "js", "tidalsongs.js")
DEFAULT_TOKEN_FILE = os.path.join(os.path.dirname(REPO), ".tidal_token")    # .../cv/.tidal_token
ART_SIZE = 640
PAGE = 500


def read_token_source():
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as fh:
            return fh.read().strip()
    if os.environ.get("TIDAL_TOKEN"):
        return os.environ["TIDAL_TOKEN"].strip()
    if os.path.exists(DEFAULT_TOKEN_FILE):
        with open(DEFAULT_TOKEN_FILE, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    sys.exit(
        "No token found. Pass a token file as the first argument, set "
        "$TIDAL_TOKEN, or create " + DEFAULT_TOKEN_FILE + "."
    )


def parse_token(raw):
    """Return (token_type, access_token, refresh_token, expiry_time)."""
    raw = raw.strip()
    if raw.startswith("{"):
        data = json.loads(raw)
        access = data.get("access_token") or data.get("accessToken")
        if not access:
            sys.exit("Token JSON has no 'access_token'.")
        return (
            data.get("token_type") or data.get("tokenType") or "Bearer",
            access.strip(),
            data.get("refresh_token") or data.get("refreshToken"),
            data.get("expiry_time") or data.get("expiryTime"),
        )
    if raw.lower().startswith("bearer "):
        raw = raw[7:].strip()
    return ("Bearer", raw, None, None)


def login(session):
    token_type, access, refresh, _expiry = parse_token(read_token_source())
    # expiry_time wants a datetime, not the ISO string a session export carries;
    # a freshly-grabbed access token is valid now, so we skip it and let the
    # refresh token (if any) cover the rare case it lapses mid-run.
    try:
        session.load_oauth_session(token_type, access, refresh)
    except TypeError:
        # Signatures vary across tidalapi versions; fall back to the minimal form.
        session.load_oauth_session(token_type, access)
    if not session.check_login():
        sys.exit(
            "Tidal rejected the token (expired or invalid). Grab a fresh "
            "access token from listen.tidal.com and try again."
        )


def art_url(track):
    try:
        album = track.album
        if album is None:
            return None
        return album.image(ART_SIZE)
    except Exception:
        for size in (320, 160, 80):
            try:
                return track.album.image(size)
            except Exception:
                continue
    return None


def artist_name(track):
    try:
        names = [a.name for a in (track.artists or []) if getattr(a, "name", None)]
        if names:
            return ", ".join(names)
    except Exception:
        pass
    return getattr(getattr(track, "artist", None), "name", "") or "Unknown artist"


def total_favorites(session):
    """The real favourites count from the raw endpoint, or None if unavailable.

    Each page returns FEWER items than requested (Tidal drops tracks that are
    unavailable in the account's region), so the returned length can't be used
    to detect the end - `offset` indexes the full list, so we page by fixed PAGE
    steps until offset passes this total instead.
    """
    try:
        j = session.request.request(
            "GET",
            "users/%d/favorites/tracks" % session.user.id,
            params={"limit": 1, "offset": 0},
        ).json()
        return j.get("totalNumberOfItems")
    except Exception:
        return None


def fetch_all(session):
    favorites = session.user.favorites
    total = total_favorites(session)
    out = []
    offset = 0
    empty_pages = 0
    while True:
        batch = favorites.tracks(limit=PAGE, offset=offset)
        for track in batch:
            title = getattr(track, "name", None)
            art = art_url(track)
            if not title or not art:
                continue
            out.append({"title": title, "artist": artist_name(track), "art": art})
        if total is not None:
            print("  ...%d/%d scanned, %d kept" % (min(offset + PAGE, total), total, len(out)))
        offset += PAGE
        if total is not None:
            if offset >= total:
                break
        else:
            # No total to steer by: stop only after two consecutive fully-empty
            # pages, so a single region-emptied window doesn't end it early.
            empty_pages = empty_pages + 1 if not batch else 0
            if empty_pages >= 2:
                break
        if offset > 100000:  # hard safety cap against a runaway loop
            break
    # Guard against any accidental overlap producing duplicates.
    seen, deduped = set(), []
    for e in out:
        key = (e["title"], e["artist"], e["art"])
        if key not in seen:
            seen.add(key)
            deduped.append(e)
    return deduped


HEADER = """/*
 * TIDAL SONGS - the pool the "Music" window picks a random favourite from.
 *
 * AUTO-GENERATED by tools/scrape_tidal.py from the account's
 * Favourites -> Tracks. Do not hand-edit; re-run the scraper to refresh:
 *   /media/vanafa/1TB/Workspace/cv/.venv-tidal/bin/python tools/scrape_tidal.py
 *
 * %d track(s). Each entry: { title, artist, art } (640px album cover URL).
 */
"""


def write_js(songs):
    body = json.dumps(songs, indent=2, ensure_ascii=False)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(HEADER % len(songs))
        fh.write("window.TIDAL_SONGS = " + body + ";\n")


def main():
    session = tidalapi.Session()
    login(session)
    print("Logged in. Fetching favourite tracks...")
    songs = fetch_all(session)
    if not songs:
        sys.exit("No favourite tracks found (or none had album art).")
    write_js(songs)
    print("Wrote %d tracks to %s" % (len(songs), OUT))


if __name__ == "__main__":
    main()
