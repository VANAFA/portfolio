# Feature backlog

Ideas the user wants to add next. Not started unless noted. Ordered roughly by
dependency (later items build on earlier ones), not by priority.

## 1. Travel blog section ("blog de viajes")

- New content type alongside the existing project blog (`js/data.js` /
  `blog.html`), or its own page — needs a decision on which once we start.
- **Encrypted behind a shared-secret question.** The unlock key is the answer
  to a question only the user's friends would know (confirmed: *"¿qué marca
  de reloj uso?"* — what brand of watch does the user wear). Entering the
  right answer decrypts the content client-side.
- Both the text **and the images** should look encrypted/scrambled until
  unlocked — text as ciphertext-looking characters, images with their pixels
  visibly shuffled (a client-side pixel-shuffle filter, not real crypto on
  the image format).
- **Honest caveat to raise with the user before building this:** this is a
  static site with no server, so "encryption" here can only ever be
  *client-side obfuscation* — the ciphertext, the shuffled pixels, and the
  unlock logic all ship in the page source. A motivated visitor could read
  the unscrambling code and recover the content without knowing the answer.
  That's fine for "keep casual visitors out and make it a fun puzzle for
  friends" — it is **not** real confidentiality. Worth confirming that's the
  actual goal before writing it, so expectations match what's actually
  deliverable.
- Sub-sections planned inside the travel blog once it exists:
  - **Games log**, connected to Backloggd (games played/backlog tracking).
  - **Cars** blog/log.
  - **Music**, connected to the user's Tidal listening.
  - All three need a feasibility check: Backloggd and Tidal don't offer easy
    public read-only APIs for a no-backend static site — likely needs either
    manual data entry (simplest, fits the site's existing
    add-one-object-and-it-renders philosophy) or a small periodic export
    script instead of a live API call from the browser.

## 2. Tidal "recommend a song" window

- A window with a button that picks a random song from a curated list of the
  user's favorite Tidal tracks and shows the album art.
- Simplest honest version: a `js/data.js`-style array the user maintains by
  hand (song, artist, album art URL, maybe a Tidal link) — no live Tidal API
  call, since Tidal doesn't expose one usable from a static client-side page
  without a backend and auth. Matches the site's existing data-driven
  pattern (`window.PROJECTS`, `window.BACKGROUNDS`, etc.).

## 3. Digital twin on Hugging Face

- A small chatbot/model trained or prompted to answer "as" the user, hosted
  on Hugging Face (small enough to be affordable to run there — likely a
  Space with a small open model + a system prompt/RAG over the user's own
  info, rather than a fine-tune).
- This is a separate project from the static site itself — the site would
  just embed/link to it (e.g. an iframe to the HF Space, or a window that
  calls its API). Needs its own scoping session when the user's ready to
  start it.

## 4. Messenger app (contact form)

- A window styled like a 90s messenger where visitors can write the user a
  message.
- Static site has no backend to receive/store submissions — needs either a
  form-backend service (e.g. Formspree/Getform-style), a `mailto:` fallback,
  or a small serverless function. Needs a decision on which before building.

## 5. 90s-style phone number banner

- Show the contact phone number the way phone keypad "vanity numbers" were
  advertised in the 90s: mixing digits and letters, animated like an old
  marquee/banner ad. Format given: `+54 011 FLOW-####`.
- Depends on picking the actual vanity letters for the last 4 digits — in
  progress separately (see `vanitygen.py` in the repo root and the filtered
  shortlist from it).

## 6. Console collection window

- A window listing the consoles the user collects: owned vs. still wanted.
- For consoles marked "wanted," a visitor who has one should be able to
  contact the user to sell it — reuses whatever contact mechanism the
  Messenger app (#4) ends up using, so probably build that first.
- Data-driven like the rest of the site: one array, one object per console,
  with an `owned: true/false` flag.
