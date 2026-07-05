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

## 3D Beach View

Each beach detail screen now has a "View in 3D" button and a bigger,
expandable 2D map. The 3D view (`src/components/Beach3DView.jsx`, built with
Three.js) is a **stylized, schematic representation** — sand and water
planes with the same hazard markers and zone outlines as the 2D map,
rendered in 3D with drag-to-look-around, scroll-to-zoom controls.

**This is not photographic Street View of the real beach.** True
photographic 3D exploration would require real 360°/drone imagery captured
per beach, which is out of scope for this prototype. What's built instead
is honest and still useful: the exact same safety data an admin drew on the
2D map, explorable in 3D.

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
