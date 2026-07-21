# Capstone — 360° Orientation (shell)

A browser-based, look-around-and-click **360° panorama training experience**.
The learner stands in the center of a spherical panorama, drags to look around,
and clicks glowing **hotspots** to open short lessons. Completing hotspots
**unlocks** others, and progress is tracked with **xAPI** to a Veracity LRS.

This is the **working skeleton**: viewer, hotspots, gating, popups, tracking,
persistence, authoring mode, and the deploy pipeline all work end to end with
placeholder lesson copy. Real lesson text and precise hotspot positions get
filled in afterward (see **Authoring mode** below).

---

## Tech stack

- **Front end:** vanilla JavaScript + **Three.js** (loaded from a CDN via an
  import map — no build step).
- **Hosting:** **Vercel** (static front end + one serverless function).
- **Tracking:** **xAPI** statements sent to a **Veracity LRS**, always through
  our own serverless proxy.

> **Security rule (important):** the Veracity endpoint and credentials live
> **only** in the serverless function (`/api/track.js`), read from environment
> variables at runtime. They never appear in any client-side file. The browser
> talks only to our own `/api/track`, which attaches credentials server-side and
> forwards to Veracity.

---

## Project structure

```
capstone/
  index.html
  public/
    academic-room.png       # the 2:1 equirectangular panorama
  src/
    main.js                 # orchestrator: wires everything together
    viewer.js               # Three.js panorama + drag look-around controls
    hotspots.js             # hotspot markers: render, position, hover, click
    hotspots.config.js      # EDITABLE list of hotspots (positions, labels, gating)
    interactions.js         # popup/modal + checkbox-completion logic
    gating.js               # rule-based lock/unlock (entry -> core -> final)
    xapi.js                 # client helper: POSTs statements to /api/track
    launch.js               # name/email gate (learner identity)
    state.js                # progress persistence: localStorage + LRS sync
    xapiState.js            # client for the xAPI State API (resume) via /api/state
    authoring.js            # AUTHORING MODE — read yaw/pitch to place hotspots
    styles.css
  api/
    track.js                # serverless proxy: statements -> Veracity /statements
    state.js                # serverless proxy: progress doc <-> Veracity State API
  vercel.json
  .env.local.example        # documents required env vars (no real values)
  package.json
  README.md
```

---

## Environment variables

Set these three (and only these) — locally in `.env.local`, and in production
in the Vercel dashboard. They are read **only** inside `/api/track.js`.

| Variable            | What it is                                         | Example                                    |
| ------------------- | -------------------------------------------------- | ------------------------------------------ |
| `VERACITY_ENDPOINT` | The LRS **statements** endpoint (note `/statements`) | `https://your-lrs.lrs.io/xapi/statements`  |
| `VERACITY_KEY`      | LRS basic-auth **key** (username)                  | `abc123...`                                |
| `VERACITY_SECRET`   | LRS basic-auth **secret** (password)               | `xyz789...`                                |

**Where to get them (Veracity free tier):** create/open your LRS at
[veracity.it / lrs.io], go to the LRS's **Basic Auth** / access-key settings,
and create a key + secret pair. The endpoint is your LRS's xAPI base URL with
`/statements` appended.

Start from the template:

```bash
cp .env.local.example .env.local
# then edit .env.local and paste your three real values
```

---

## Run locally

You need the [Vercel CLI](https://vercel.com/docs/cli) so the `/api/track`
serverless function runs alongside the static files:

```bash
npm i -g vercel      # once
cd capstone
vercel dev           # serves the site + /api/track on http://localhost:3000
```

Open **http://localhost:3000**.

- Without valid env vars, everything still works **except** the xAPI send —
  those calls fail gracefully and are logged to the browser console. The viewer,
  hotspots, gating, popups, and localStorage all work offline.
- You can also open the site with any static server (e.g. `npx serve .`), but
  then `/api/track` won't exist, so tracking calls will 404 (again, non-fatal).

---

## Authoring mode — placing the hotspots

You can't give pixel positions blind, so use authoring mode to read off exact
coordinates from **your** image:

1. Open the site with **`?edit=1`** in the URL (e.g.
   `http://localhost:3000/?edit=1`), **or** press **`E`** while inside.
2. **Click any object** in the panorama. The on-screen readout (top-left) and
   the browser **console** print the exact `yaw` / `pitch` (degrees) and a
   normalized direction vector for that point.
3. Copy the `yaw:` / `pitch:` numbers into the matching hotspot in
   [`src/hotspots.config.js`](src/hotspots.config.js).
4. Reload. The marker now sits on that object.

Coordinate convention: `yaw` = degrees around the room (0 faces the panorama's
center/front, positive turns right, range −180…180); `pitch` = degrees up/down
(0 = horizon, + up, − down).

---

## The seven hotspots & gating

| id         | Title                        | Role      | Unlocks when…                    |
| ---------- | ---------------------------- | --------- | -------------------------------- |
| `welcome`  | Welcome to Capstone          | **entry** | live from the start              |
| `schedule` | Daily Schedule               | core      | after `welcome` is complete      |
| `academics`| Academic Expectations        | core      | after `welcome` is complete      |
| `anchored` | Anchored at Home             | core      | after `welcome` is complete      |
| `rules`    | Rules for Capstone Students  | core      | after `welcome` is complete      |
| `overview` | Academic Overview            | core      | after `welcome` is complete      |
| `final`    | Final Message                | **final** | after **all** core are complete  |

The gating engine ([`src/gating.js`](src/gating.js)) is **rule-based off the
`role` field**, not hardcoded per id — so you can add or remove `core` hotspots
in `hotspots.config.js` without touching the logic.

---

## What gets tracked (xAPI)

All statements flow: browser → `/api/track` → Veracity. Actor is
`{ mbox: "mailto:<email>", name: "<name>" }` from the launch screen.

- **Popup opened** → `experienced` for that hotspot's activity.
- **Checkbox checked** → `completed` for that activity, with
  `result.completion = true`.
- **Final hotspot completed** → additionally a course-level `completed` for the
  whole Capstone activity.

Activity IRIs are built from one base constant (`ACTIVITY_BASE` in
`hotspots.config.js`), e.g. `https://capstone.local/xapi/activities/<hotspot-id>`
— change it in that one place.

---

## Progress persistence (two layers, read + write)

Progress is stored in two places, and [`src/state.js`](src/state.js) keeps them
in sync:

1. **localStorage** — synchronous and offline-capable. The UI reads this
   directly, so it never waits on the network. Identity + completed hotspots
   live here for instant resume on the same browser.
2. **Veracity LRS via the xAPI State API** — the durable, cross-device source of
   truth. This is the **read** direction: on entry the app pulls the learner's
   stored progress document and merges it in (`hydrateFromLRS`), so a learner who
   started on one device resumes on another. On every completion it **writes**
   the updated document back.

Because completion is monotonic (once done, always done), merging local + remote
is a conflict-free **union** of completed ids. If the LRS is unreachable,
everything still works off localStorage and the app just logs a warning.

Flow: browser ⇄ `/api/state` ⇄ Veracity `.../activities/state`. The State API
base URL is **derived** from `VERACITY_ENDPOINT` (swap `/statements` for
`/activities/state`), so there is **no extra environment variable** to set.

The HUD (bottom-left) shows progress and a **Reset** button (clears completions,
keeps identity); it also deletes the LRS progress document. The full `?reset=1`
wipe clears identity + progress locally and in the LRS.

---

## Deploy to Vercel

1. Push this `capstone/` folder to a Git repo (GitHub/GitLab/Bitbucket), **or**
   run `vercel` from inside the folder to link it.
2. In the Vercel dashboard, **import the project**. Framework preset: **Other**
   (no build step; it's static + a serverless function). Root directory: the
   `capstone` folder.
3. **Project → Settings → Environment Variables:** add `VERACITY_ENDPOINT`,
   `VERACITY_KEY`, `VERACITY_SECRET` (for Production, and Preview if you want
   tracking on preview deploys).
4. **Deploy.** Your site is live; the browser calls `/api/track` on the same
   origin, and the function forwards to Veracity with the credentials attached
   server-side.

CLI alternative:

```bash
cd capstone
vercel                     # first deploy / link (Preview)
vercel env add VERACITY_ENDPOINT
vercel env add VERACITY_KEY
vercel env add VERACITY_SECRET
vercel deploy --prod       # promote to Production
```

---

## Scope of this build

**Built:** launch/identity gate, panorama viewer with drag look-around, all
seven hotspots, authoring mode, hover highlight, click-to-open popup with
checkbox completion, entry→core→final gating, the `/api/track` proxy with a
working xAPI send, localStorage persistence, and **xAPI State API resume**
(read + write) via the `/api/state` proxy for cross-device progress.

**Placeholder:** the lesson copy inside each popup, and the hotspot positions
(replace via authoring mode).

**Not built (by design):** any framework or extra build complexity; analytics or
content beyond the seven hotspots.
