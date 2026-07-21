// main.js
//
// Orchestrator: wires together the launch gate, the panorama viewer, hotspots,
// authoring mode, the interaction popup, gating, and the small HUD.

import { Viewer } from "./viewer.js";
import { Hotspots } from "./hotspots.js";
import { Interactions } from "./interactions.js";
import { Authoring } from "./authoring.js";
import { Launch } from "./launch.js";
import { HOTSPOTS } from "./hotspots.config.js";
import { getCompletedIds, resetProgressKeepIdentity, resetAll } from "./state.js";

const PANORAMA_URL = "/public/academic-room.png";

// Full reset via URL: visiting with ?reset=1 wipes ALL saved state (identity +
// progress) so you get a clean start — the launch screen reappears and every
// hotspot re-locks. The param is stripped from the address bar afterward so a
// refresh doesn't wipe again. Handy for testing and content authoring.
if (new URLSearchParams(location.search).get("reset") === "1") {
  resetAll();
  const url = new URL(location.href);
  url.searchParams.delete("reset");
  history.replaceState(null, "", url);
}

const viewerEl = document.getElementById("viewer");
const layerEl = document.getElementById("hotspot-layer");
const readoutEl = document.getElementById("author-readout");
const hudEl = document.getElementById("hud");
const hudProgress = document.getElementById("hud-progress");
const hudReset = document.getElementById("hud-reset");

let viewer, hotspots, interactions;

function updateHud() {
  const done = getCompletedIds().filter((id) =>
    HOTSPOTS.some((h) => h.id === id)
  ).length;
  hudProgress.textContent = `${done} / ${HOTSPOTS.length} complete`;
}

function enterExperience() {
  // Build the viewer once.
  if (viewer) return;

  viewer = new Viewer(viewerEl, PANORAMA_URL);

  interactions = new Interactions({
    onCompleted: () => {
      // A hotspot just completed: refresh markers so newly unlocked ones
      // appear, and update the HUD.
      hotspots.refreshStates();
      updateHud();
    },
  });

  hotspots = new Hotspots(viewer, layerEl, {
    onActivate: (hotspot) => interactions.open(hotspot),
  });

  // Authoring mode (for placing hotspots).
  new Authoring(viewer, readoutEl);

  hudEl.classList.remove("hidden");
  updateHud();

  // Debug handle (no secrets are ever on the client). Handy for verifying the
  // viewer from the console; safe to leave in a shell build.
  window.capstone = { viewer, hotspots, interactions };
}

// HUD reset.
hudReset.addEventListener("click", () => {
  if (!confirm("Reset all progress on this device? (Your name/email stays.)")) {
    return;
  }
  resetProgressKeepIdentity();
  hotspots.refreshStates();
  updateHud();
});

// Launch gate. If identity is already known, this enters immediately.
const launch = new Launch({ onEnter: () => enterExperience() });
launch.start();
