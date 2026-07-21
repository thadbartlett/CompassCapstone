// state.js
//
// Progress persistence, in TWO layers:
//
//   1. localStorage  — synchronous, instant, offline-capable. The app reads
//      this directly (isComplete/getCompletedIds are sync), so the UI never
//      waits on the network.
//   2. Veracity LRS via the xAPI State API — the durable, cross-device source
//      of truth. On startup we pull the learner's stored progress and merge it
//      in (hydrateFromLRS); on every change we push the updated document up.
//
// Completion is monotonic (once done, always done), so merging is a simple
// union of local + remote completed ids — no conflicts, safe across devices.
// If the LRS is unreachable, everything still works off localStorage.

import { loadStateDoc, saveStateDoc, deleteStateDoc } from "./xapiState.js";

const STORAGE_KEY = "capstone.progress.v1";

function emptyState() {
  return {
    identity: null, // { name, email }
    completed: {}, // { [hotspotId]: true }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      identity: parsed.identity ?? null,
      completed: parsed.completed ?? {},
    };
  } catch (err) {
    console.warn("[state] could not read stored progress:", err);
    return emptyState();
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[state] could not persist progress:", err);
  }
}

// In-memory copy, hydrated once on module load.
let _state = load();

export function getIdentity() {
  return _state.identity;
}

export function setIdentity(identity) {
  _state.identity = { name: identity.name, email: identity.email };
  save(_state);
}

export function hasIdentity() {
  return !!(_state.identity && _state.identity.email);
}

export function isComplete(hotspotId) {
  return !!_state.completed[hotspotId];
}

export function markComplete(hotspotId) {
  _state.completed[hotspotId] = true;
  save(_state);
  pushStateToLRS(); // mirror to the LRS (fire-and-forget)
}

export function getCompletedIds() {
  return Object.keys(_state.completed).filter((id) => _state.completed[id]);
}

export function resetAll() {
  const id = _state.identity;
  _state = emptyState();
  save(_state);
  if (id && id.email) {
    deleteStateDoc(id).catch((e) =>
      console.warn("[state] LRS state delete failed:", e)
    );
  }
}

// Clear completions but keep the learner's identity (used by the HUD reset).
export function resetProgressKeepIdentity() {
  const id = _state.identity;
  _state = { identity: id, completed: {} };
  save(_state);
  if (id && id.email) {
    deleteStateDoc(id).catch((e) =>
      console.warn("[state] LRS state delete failed:", e)
    );
  }
}

// ---- LRS sync (xAPI State API) ----------------------------------------

// Push the current progress document to the LRS. Fire-and-forget: failures are
// logged, never block the UI, and localStorage still holds the truth locally.
function pushStateToLRS() {
  const id = _state.identity;
  if (!id || !id.email) return;
  saveStateDoc(id, {
    completed: _state.completed,
    updatedAt: new Date().toISOString(),
  }).catch((e) => console.warn("[state] LRS state save failed:", e));
}

// Pull the learner's stored progress from the LRS and merge it into local
// state (union of completed ids). Call once, after identity is known. Returns
// { changed } so the caller can refresh the UI if remote progress was found.
// Safe to call when the LRS is unreachable — it just resolves { changed:false }.
export async function hydrateFromLRS() {
  const id = _state.identity;
  if (!id || !id.email) return { changed: false };
  try {
    const doc = await loadStateDoc(id);
    let changed = false;
    if (doc && doc.completed) {
      for (const key of Object.keys(doc.completed)) {
        if (doc.completed[key] && !_state.completed[key]) {
          _state.completed[key] = true;
          changed = true;
        }
      }
      if (changed) save(_state);
    }
    // Ensure the LRS reflects any local-only completions too (superset), and
    // creates the document on first visit.
    pushStateToLRS();
    return { changed };
  } catch (e) {
    console.warn("[state] LRS hydrate failed (using local only):", e);
    return { changed: false, error: e };
  }
}
