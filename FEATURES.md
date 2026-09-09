# Feature backlog

Ideas the user wants to add next. Not started unless noted. Ordered roughly by
dependency (later items build on earlier ones), not by priority.

## 1. Travel blog section ("blog de viajes") — v1 shipped

- Live at `travel.html` (linked from "My Projects" and a desktop icon).
  Gated behind the question *"¿qué marca de reloj uso?"* — what brand of
  watch does the user wear.
- Turned out better than the original caveat below assumed: it's **real
  AES-256-GCM encryption**, keyed by PBKDF2 over the answer
  (`tools/encrypt_travel.js` encrypts at authoring time, `js/travel.js`
  decrypts in-browser via WebCrypto). `js/traveldata.js` contains only
  ciphertext — there is no plaintext shipped anywhere, and a wrong answer
  just fails the AES-GCM auth tag, same as any other AEAD decrypt. ~~The
  obfuscation-only caveat originally written here no longer applies.~~ The
  real remaining caveat: the ciphertext and salt are public, so the answer's
  own strength is the actual security boundary — an offline dictionary
  attack against a short list of guesses is the realistic risk, not reading
  the JS.
- Text does a decode-scramble reveal animation and photos reveal via a
  canvas tile-shuffle — both cosmetic flourishes on top of the real crypto,
  not the security mechanism itself (satisfies "todo el texto se vea
  encriptado... que los píxeles se mezclen").
- Ships with one placeholder `demo-trip` entry (answer: `demo`) so the
  mechanism has something real to decrypt. See the README's "Travel blog
  (encrypted)" section for how to add real trips.
- Sub-sections still to build inside the travel blog:
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

## 5. 90s-style phone number banner — shipped

- Live in the Contact window: a scrolling LED-ticker marquee alternating
  `+54 011 FLOW-ILLA` / `+54 011 FLOW-ILLA` (the vanity letters found via
  `vanitygen.py` — `FLOWILLA` spells FLOW *and* contains WILL/WILLA) /
  "CONTACT NUMBER", all wrapped in a `tel:` link. Respects
  `prefers-reduced-motion`.

## 6. Console collection window

- A window listing the consoles the user collects: owned vs. still wanted.
- For consoles marked "wanted," a visitor who has one should be able to
  contact the user to sell it — reuses whatever contact mechanism the
  Messenger app (#4) ends up using, so probably build that first.
- Data-driven like the rest of the site: one array, one object per console,
  with an `owned: true/false` flag.
