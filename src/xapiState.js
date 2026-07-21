// xapiState.js  (CLIENT side)
//
// Thin client for the xAPI **State API**, talking only to our own /api/state
// proxy (never to Veracity directly — no credentials on the client). This is
// the "resume" channel: read/write a small progress document keyed by the
// learner's agent.
//
// The stored document shape is our own: { completed: { [id]: true }, updatedAt }.

import { COURSE_ACTIVITY_ID } from "./hotspots.config.js";

// One stateId identifies the progress document for this experience.
const STATE_ID = "capstone-progress";

function agentFor(identity) {
  const a = { objectType: "Agent", mbox: `mailto:${identity.email}` };
  if (identity.name) a.name = identity.name;
  return a;
}

function query(identity) {
  return new URLSearchParams({
    activityId: COURSE_ACTIVITY_ID,
    stateId: STATE_ID,
    agent: JSON.stringify(agentFor(identity)),
  }).toString();
}

// Read the progress document. Returns the parsed doc, or null if none exists.
export async function loadStateDoc(identity) {
  const res = await fetch(`/api/state?${query(identity)}`);
  if (res.status === 404) return null; // no document yet — first visit
  if (!res.ok) throw new Error(`state GET failed: ${res.status}`);
  return res.json();
}

// Write (overwrite) the progress document.
export async function saveStateDoc(identity, doc) {
  const res = await fetch(`/api/state?${query(identity)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
    keepalive: true,
  });
  if (!res.ok) throw new Error(`state PUT failed: ${res.status}`);
}

// Delete the progress document (used on full reset).
export async function deleteStateDoc(identity) {
  const res = await fetch(`/api/state?${query(identity)}`, {
    method: "DELETE",
    keepalive: true,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`state DELETE failed: ${res.status}`);
  }
}
