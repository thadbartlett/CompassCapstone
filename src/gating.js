// gating.js
//
// Rule-based lock/unlock. The rules are expressed in terms of hotspot ROLES,
// not specific ids, so you can add or remove core hotspots in
// hotspots.config.js without touching this file.
//
//   entry  -> always unlocked.
//   core   -> unlocked once the (single) entry hotspot is complete.
//   final  -> unlocked once EVERY core hotspot is complete.
//
// A hotspot's "state" is one of: "locked" | "unlocked" | "complete".

import { HOTSPOTS } from "./hotspots.config.js";
import { isComplete } from "./state.js";

function byRole(role) {
  return HOTSPOTS.filter((h) => h.role === role);
}

export function isEntryComplete() {
  const entries = byRole("entry");
  // Every entry hotspot complete (normally there is exactly one).
  return entries.length > 0 && entries.every((h) => isComplete(h.id));
}

export function areAllCoreComplete() {
  const core = byRole("core");
  // If there are no core hotspots at all, treat the gate as satisfied.
  return core.every((h) => isComplete(h.id));
}

// Is this hotspot currently unlocked (interactive)?
export function isUnlocked(hotspot) {
  switch (hotspot.role) {
    case "entry":
      return true;
    case "core":
      return isEntryComplete();
    case "final":
      return areAllCoreComplete();
    default:
      // Unknown role: fail safe to locked.
      console.warn(`[gating] unknown role "${hotspot.role}" on ${hotspot.id}`);
      return false;
  }
}

// Convenience: full display state for a hotspot.
export function getHotspotState(hotspot) {
  if (isComplete(hotspot.id)) return "complete";
  return isUnlocked(hotspot) ? "unlocked" : "locked";
}
