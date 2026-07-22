// hotspots.config.js
//
// The editable list of hotspots. This is the file you will hand-tune after
// using AUTHORING MODE to read off real yaw/pitch values for your image.
//
// HOW TO PLACE A HOTSPOT
// 1. Open the experience with ?edit=1 in the URL (or press "E" while inside).
// 2. Click the object in the panorama. The on-screen readout + the browser
//    console print the exact { yaw, pitch } (degrees) and a direction vector.
// 3. Copy the yaw/pitch numbers into the matching hotspot below.
//
// COORDINATE CONVENTION (matches viewer.js / hotspots.js)
//   yaw   = degrees around the room. 0 looks toward -Z (the panorama's
//           "front"/center). Positive yaw turns to the right. Range -180..180.
//   pitch = degrees up/down. 0 = horizon, +up, -down. Range roughly -85..85.
//
// GATING ROLES ("role")
//   entry  -> live from the start; completing it unlocks all core hotspots.
//   core   -> locked until the entry hotspot is complete.
//   final  -> locked until ALL core hotspots are complete.
// The gating engine (gating.js) is rule-based off these roles, so you can add
// or remove core hotspots here without touching the logic.

// Base IRI used to build xAPI activity ids. Change this in ONE place.
export const ACTIVITY_BASE = "https://capstone.local/xapi/activities";

// The whole-course activity id (sent when the final hotspot completes).
export const COURSE_ACTIVITY_ID = `${ACTIVITY_BASE}/capstone-orientation`;
export const COURSE_ACTIVITY_NAME = "Capstone Orientation";

// Default hit radius (pixels) for a marker if one isn't specified.
export const DEFAULT_HIT_RADIUS = 34;

// The seven hotspots. Positions (yaw/pitch) were set from the real image via
// authoring mode; re-run authoring mode to fine-tune any of them.
export const HOTSPOTS = [
  {
    id: "welcome",
    label: "Welcome to Capstone",
    role: "entry",
    // Open arched doorway. Live from start.
    yaw: -90.5,
    pitch: 26.4,
    hitRadius: 34,
    body: `
      <p><strong>Welcome!</strong> This is placeholder copy for the entry
      lesson.</p>
      <p>Look around the room by dragging. Complete this section to unlock the
      rest of the orientation.</p>
    `,
  },
  {
    id: "schedule",
    label: "Daily Schedule",
    role: "core",
    // Wall clock and schedule board.
    yaw: 110.5,
    pitch: 16.4,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for the daily schedule.</p>
      <p>A couple of lines describing when things happen during the day.</p>
    `,
  },
  {
    id: "academics",
    label: "Academic Expectations",
    role: "core",
    // Lectern with open planner and books.
    yaw: 179.2,
    pitch: -14.2,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for academic expectations.</p>
      <p>What is expected of students academically.</p>
    `,
  },
  {
    id: "anchored",
    label: "Anchored at Home",
    role: "core",
    // Study table with anchor, lamp, Bible, and family photo.
    yaw: -123.7,
    pitch: -7.4,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for "Anchored at Home".</p>
      <p>How home life and study connect.</p>
    `,
  },
  {
    id: "rules",
    label: "Rules for Capstone Students",
    role: "core",
    // Framed checklist board on the right wall.
    yaw: 29.7,
    pitch: 8.1,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for the rules.</p>
      <p>A short list of expectations for Capstone students.</p>
    `,
  },
  {
    id: "overview",
    label: "Academic Overview",
    role: "core",
    // Large academic bookcase.
    yaw: -34.3,
    pitch: 5.2,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for the academic overview.</p>
      <p>A high-level look at the academic program.</p>
    `,
  },
  {
    id: "final",
    label: "Final Message",
    role: "final",
    // Brass compass and sealed scroll on the round table.
    yaw: 47,
    pitch: -36.4,
    hitRadius: 34,
    body: `
      <p>Placeholder copy for the final message.</p>
      <p>Congratulations on completing the orientation.</p>
    `,
  },
];
