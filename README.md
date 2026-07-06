# BeachSafe Live

A prototype beach safety system for Australian surf lifesavers and tourists,
built as two connected front-end apps sharing one mock data layer:

- **Tourist App** (`src/apps/TouristApp.jsx`) — beach map, live safety flags,
  lifeguard broadcast, instant multilingual translation, emergency screen.
- **Lifesaver Admin** (`src/apps/AdminApp.jsx`) — role-based login, assigned
  beach selector, alert composer with presets, severity, expiry, live
  broadcast controls, audit log, and a live public-page preview.

Both are combined behind a simple switcher in `src/App.jsx` for demo
purposes only. In a real deployment these would likely be two separate
apps (e.g. a public tourist app and a locked-down admin app) sharing one
backend API.

**They're connected.** Both apps read and write the same data through
`src/store/BeachDataContext.jsx`. Publish an alert in the admin composer
and it appears immediately in the tourist app's live broadcast screen —
same beach flag status, same active alerts, same live-broadcast indicator.
Switch to "Tourist App" in the top switcher after publishing an alert as
an admin to see it live. Note this sync currently only works within one
browser tab/session, since it's plain React state — see `FUTURE:` notes
in `BeachDataContext.jsx` for what a real backend swap looks like.

## Status: MVP / prototype

All data is currently mocked in-memory (see the `MOCK DATA` / `MOCK BACKEND`
comment blocks at the top of each app file). Nothing persists between page
reloads. Look for `FUTURE:` comments throughout the code — they mark exactly
where real integrations should go:

- Real authentication (replacing the PIN pad)
- A real database / API instead of in-memory React state
- GPS-based "nearest beach" detection
- Push notifications
- A real translation service
- Live map SDK (Mapbox / Google Maps)
- WebSocket or push-based live broadcast instead of a local toggle

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
beachsafe-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx        # Vite/React entry point
    ├── App.jsx          # Switches between Tourist and Admin apps
    ├── index.css         # Tailwind entry
    └── apps/
        ├── TouristApp.jsx
        └── AdminApp.jsx
```

## Live voice broadcast with real-time translation

Lifesavers can now broadcast by **speaking**, not just by picking preset
buttons. On the Composer tab, "Start voice broadcast":

1. Uses the browser's built-in speech-to-text (the Web Speech API — no
   API key, no extra cost, works natively in Chrome/Safari) to transcribe
   what the lifesaver says, live.
2. Each finalized sentence is sent to a free public translation API
   (MyMemory) and translated into all 6 offered non-English languages in
   parallel.
3. The English line appears on the tourist app's Live screen **instantly**;
   each translation fills in moments later as it comes back — an honest
   reflection of real network latency, not a faked instant translation.
4. Tourists see **both** the translated text and the original English,
   clearly labeled, exactly as requested.

**Two honesty notes:**
- **Browser support**: the Web Speech API isn't available in Firefox. The
  admin UI detects this and shows a clear message rather than silently
  failing.
- **Translation API**: MyMemory's free/anonymous tier is rate-limited
  (roughly a few thousand words/day) and is a best-effort public service,
  not a paid SLA-backed product. Great for a prototype and demos; a real
  production deployment handling real lifeguard broadcasts should use a
  paid service (Google Cloud Translation, DeepL API, Azure Translator)
  with the API key held server-side, never in client code.

Voice broadcast automatically turns on "live broadcast" status if it
wasn't already on — it doesn't make sense to have a live transcript feed
without the beach showing as actively broadcasting.

The preset-button alert composer still works exactly as before — voice
broadcast is additive, not a replacement.

## Language selector moved

The language picker used to be a bottom-nav tab. It's now the chip in the
top-right corner of every screen (previously just a static display of the
current language) — tap it to open the language picker directly. The
bottom nav is down to 2 tabs (Beaches, Live) as a result. The chip is
intentionally hidden on the Emergency screen to keep that screen focused
during a crisis.

## Accounts

Both apps now have account creation:

- **Tourists**: a lightweight, name-only "profile" (no password) shown on
  first launch, with a "Continue as Guest" option. This is personalization
  (greeting, remembering preferences), not security — tourists have no
  sensitive data to protect, so a password would just add friction for no
  real benefit.
- **Lifesavers**: real self-service sign-up (name, 4-digit PIN, role, and
  which beaches you manage) from the Admin login screen ("New lifesaver?
  Create an account"). **Important**: PINs are stored in this browser's
  localStorage in plain form — fine for a prototype, not how real
  credentials should be handled. Production auth needs server-side password
  hashing, real sessions, and a real database (the "real backend" noted
  elsewhere as future work).

State (including new accounts) now also **persists across page reloads**
via localStorage, in addition to the existing cross-tab sync — so creating
an account actually means something now, not just for the current session.

## Nationwide beaches + 10km radius

The beach list now includes 23 real, named Australian beaches spanning
every state and the NT — not literally every patrolled beach in the country
(there are hundreds of surf lifesaving clubs), but a representative
nationwide spread. A real production version would pull from Surf Life
Saving Australia's official data feed instead of this hand-curated list.

The tourist Home screen now shows beaches within a 10km radius by default
(computed from real GPS when available), with a collapsible "show all
beaches nationwide" section underneath. Without GPS permission, it falls
back to showing the closest few beaches by estimated distance rather than
claiming a radius it can't actually verify.

## Full translation (tourist app)

Every user-facing string in the tourist app now goes through a real
translation system (`src/i18n/`), not just alert text:

- **`uiStrings.js`** — 98 UI strings (screen titles, buttons, condition
  labels, the emergency screen, settings, everything) translated into all
  7 offered languages: English, Chinese, Japanese, Korean, Spanish, French,
  and German.
- **Beach names are never translated** — they're proper nouns, same as
  "Paris" stays "Paris" in every language.
- **Map hazard pins now translate too** (`hazardMarkerTranslations.js`) —
  tapping a hazard marker on the map shows its translated label, with the
  same honest fallback pattern used elsewhere (original English + a note,
  if a specific admin-written hazard hasn't been pre-translated).
- **Push/live alert notifications are now translated** — this was a real
  gap before: the toast and OS notification that pop up when a new alert
  is published were showing raw English regardless of the selected
  language. Fixed — they now translate exactly like the Live screen does.

**Honesty note:** these are careful prototype-grade translations (written
directly, not through a live translation API, since this environment has no
network access to one). They should read naturally, but a real production
launch would want native-speaker review, especially for safety-critical
text like the emergency screen.

The 3D Beach View has been removed per feedback that it felt basic and
confusing. The 2D interactive map (satellite imagery, hazard pins, swim
zones) remains the primary way to explore a beach.

## Design system

A visual polish pass gave the app a more distinctive, less "generic app"
identity, grounded in real surf lifesaving:

- **Signature element**: the flag status indicator (`src/components/FlagIcon.jsx`)
  is now a real pennant silhouette with a wind-blown wavy edge, not a flat
  two-color rectangle — used everywhere a flag status appears in either app.
- **Type system**: Archivo (bold, wide — reads like real beach safety
  signage) for headings, Inter for body copy, and IBM Plex Mono for numeric
  readouts (wave height, wind, UV, PIN pad) to give safety data an
  "instrument panel" feel that's visually distinct from ordinary text.
- **Palette**: warm stone neutrals instead of cool corporate gray (evokes
  sand rather than a generic dashboard), and teal instead of emerald for
  the "safe/patrolled" accent (reads more like reef water). Danger red,
  caution amber, and the flag colors themselves were kept as-is since they
  already matched real lifesaving convention.

## Interactive beach maps

Both apps now show a real satellite map (via Leaflet + Esri World Imagery —
free, no API key required) instead of a placeholder graphic:

- **Admin → Beach Map tab**: draw the safe swim zone, mark closed areas, and
  drop hazard pins (rip current, rocks, marine life, submerged hazard,
  other) directly on the satellite image for your assigned beach.
- **Tourist → Beach detail screen**: the same map, read-only, with the
  swim zone, closed areas, and tappable hazard pins — plus a blue dot for
  the visitor's own GPS location.
- **Tourist → Home screen**: a real satellite overview of every beach at
  once; tap a pin to jump straight to that beach.

Changes made in the admin map editor sync instantly to the tourist app via
the same shared data layer (and across browser tabs via BroadcastChannel).

**Note on the map tiles:** Esri World Imagery is used because it requires no
API key, which keeps local setup simple. For a real production deployment
at scale, check Esri's usage terms for your traffic level, or switch to a
licensed provider (Mapbox, Google Maps Platform) — the `BeachMap` component
in `src/components/BeachMap.jsx` only needs its `TileLayer` URL changed.

## Admin demo logins

| Name        | PIN  | Role               | Assigned beaches            |
|-------------|------|--------------------|------------------------------|
| Sarah Chen  | 1234 | Lifesaver          | Bondi Beach                 |
| Jake Wilson | 2345 | Lifesaver          | Manly Beach                 |
| Priya Nair  | 3456 | Patrol Supervisor  | Bondi, Manly, St Kilda       |

These three seed accounts always exist. Anyone can also create a new
lifesaver account from the login screen and pick from any of the 23
nationwide beaches to manage — see the Accounts section above.

## Pushing this to GitHub

This repo isn't connected to GitHub yet. From this folder, run:

```bash
git init
git add .
git commit -m "Initial commit: BeachSafe Live MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first, without a README, then run the
commands above.)
