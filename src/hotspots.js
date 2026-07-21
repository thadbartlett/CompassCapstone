// hotspots.js
//
// Renders one HTML marker per hotspot over the panorama, keeps each marker
// positioned every frame (projecting its yaw/pitch to screen pixels), handles
// hover highlight + click, and reflects locked / unlocked / complete state.
//
// Markers are plain DOM elements in #hotspot-layer so they get crisp text,
// easy CSS hover styling, and pointer events for free.

import { Viewer } from "./viewer.js";
import { HOTSPOTS } from "./hotspots.config.js";
import { getHotspotState } from "./gating.js";

export class Hotspots {
  constructor(viewer, layerEl, { onActivate } = {}) {
    this.viewer = viewer;
    this.layerEl = layerEl;
    this.onActivate = onActivate || (() => {});
    this._markers = new Map(); // id -> { hotspot, el }

    this._build();
    // Reposition every rendered frame.
    this.viewer.onRender(() => this._reposition());
  }

  _build() {
    for (const hotspot of HOTSPOTS) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "hotspot";
      el.dataset.id = hotspot.id;
      el.dataset.role = hotspot.role; // entry | core | final — drives marker color
      el.style.setProperty("--hit", `${hotspot.hitRadius || 34}px`);
      el.innerHTML = `
        <span class="hotspot-ring"></span>
        <span class="hotspot-dot"></span>
        <span class="hotspot-check" aria-hidden="true">&#10003;</span>
        <span class="hotspot-lock" aria-hidden="true">&#128274;</span>
        <span class="hotspot-label">${hotspot.label}</span>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const state = getHotspotState(hotspot);
        // Only unlocked or already-complete hotspots are interactive.
        if (state === "locked") return;
        this.onActivate(hotspot);
      });

      this.layerEl.appendChild(el);
      this._markers.set(hotspot.id, { hotspot, el });
    }
    this.refreshStates();
  }

  // Re-evaluate lock/unlock/complete classes for every marker. Call after any
  // completion so newly unlocked hotspots appear and completed ones restyle.
  refreshStates() {
    for (const { hotspot, el } of this._markers.values()) {
      const state = getHotspotState(hotspot); // locked | unlocked | complete
      el.classList.remove("is-locked", "is-unlocked", "is-complete");
      el.classList.add(`is-${state}`);
      el.setAttribute(
        "aria-label",
        state === "locked"
          ? `${hotspot.label} (locked)`
          : state === "complete"
          ? `${hotspot.label} (complete)`
          : hotspot.label
      );
      // Locked markers are visible but not focusable/clickable as a control.
      el.tabIndex = state === "locked" ? -1 : 0;
    }
  }

  // Project each marker to screen pixels; hide those behind the camera.
  _reposition() {
    for (const { hotspot, el } of this._markers.values()) {
      const dir = Viewer.anglesToDir(hotspot.yaw, hotspot.pitch);
      const { x, y, visible } = this.viewer.dirToScreen(dir);
      if (!visible) {
        el.style.display = "none";
        continue;
      }
      el.style.display = "";
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }
  }
}
