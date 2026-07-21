// state.js
//
// Progress persistence. The **Veracity LRS (xAPI State API) is the source of
// truth**; there is deliberately NO long-term local storage of progress.
//
//   - On startup we pull the learner's stored progress from the LRS
//     (hydrateFromLRS); on every change we push the updated document back up.
//   - A small **sessionStorage** cache holds identity + progress for THIS
//     browsing session only. It gives instant paint on refresh and guards
//     against a complete-then-immediately-refresh race — but it clears when the
//     tab/browser closes, so nothing lingers on a shared or public machine, and
//     a fresh session always loads authoritatively from the LRS.
//
// Completion is monotonic (once done, always done). Because the session cache
// only ever holds this session's own knowledge, merging it with the LRS as a
// union is safe: cross-session/cross-device truth comes from the LRS, while any
// just-made completion is preserved. A reset in the LRS is reflected on the next
// session (the cache is gone), so stale completions can't be resurrected.
//
// The app requires a live connection to Veracity to load and record progress;
// if the LRS is unreachable the UI still functions off the session cache and
// surfaces a warning, and pending writes retry.

import { loadStateDoc, saveStateDoc, deleteStateDoc } from "./xapiState.js";

// Session-scoped cache (clears on tab close). NOT localStorage — that is
// intentional; see the header note above.
const store = window.sessionStorage;
const STORAGE_KEY = "capstone.progress.v1";

// One-time cleanup: earlier builds persisted progress in localStorage. Remove
// any leftover so nothing durable is left behind on the device.
try {
  window.localStorage.removeItem(STORAGE_KEY);
} catch {
  /* ignore */
}

function emptyState() {
  return {
    identity: null, // { name, email }
    completed: {}, // { [hotspotId]: true }
  };
}

function load() {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      identity: parsed.identity ?? null,
      completed: parsed.completed ?? {},
    };
  } catch (err) {
    console.warn("[state] could not read session cache:", err);
    return emptyState();
  }
}

function save(state) {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[state] could not write session cache:", err);
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

// Push the current progress document to the LRS. Non-blocking, with one retry.
// Each push sends the FULL document, so a later successful push also carries any
// earlier completion whose push failed — giving eventual consistency without a
// queue. The session cache holds progress in the meantime.
function pushStateToLRS(attempt = 0) {
  const id = _state.identity;
  if (!id || !id.email) return;
  saveStateDoc(id, {
    completed: _state.completed,
    updatedAt: new Date().toISOString(),
  }).catch((e) => {
    if (attempt < 1) {
      console.warn("[state] LRS state save failed, retrying…", e);
      setTimeout(() => pushStateToLRS(attempt + 1), 1500);
    } else {
      console.warn("[state] LRS state save failed (will retry on next change):", e);
    }
  });
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
