// state.js
//
// Progress persistence. For this shell we use localStorage.
//
// The shape is deliberately simple and self-contained so it could later be
// swapped for reading progress back from the LRS (xAPI State API) WITHOUT
// rewriting the rest of the app: everything goes through the small API below
// (getIdentity/setIdentity, getCompleted/markComplete, etc.). Replace the
// bodies of load()/save() with State API calls and nothing else changes.

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
}

export function getCompletedIds() {
  return Object.keys(_state.completed).filter((id) => _state.completed[id]);
}

export function resetAll() {
  _state = emptyState();
  save(_state);
}

// Clear completions but keep the learner's identity (used by the HUD reset).
export function resetProgressKeepIdentity() {
  _state = { identity: _state.identity, completed: {} };
  save(_state);
}
