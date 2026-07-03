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

## Admin demo logins

| Name        | PIN  | Role               | Assigned beaches            |
|-------------|------|--------------------|------------------------------|
| Sarah Chen  | 1234 | Lifesaver          | Bondi Beach                 |
| Jake Wilson | 2345 | Lifesaver          | Manly Beach                 |
| Priya Nair  | 3456 | Patrol Supervisor  | Bondi, Manly, St Kilda       |

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
