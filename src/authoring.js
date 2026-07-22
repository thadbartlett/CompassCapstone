// authoring.js
//
// AUTHORING MODE — the visual tool for placing hotspots.
//
// Toggle with ?edit=1 in the URL, or press "E" while inside. Then:
//   - Click a hotspot in the panel to SELECT it, then click in the room to drop
//     it there. Or just DRAG a marker to move it.
//   - Drag empty space to look around as usual.
//   - "Copy positions" copies a ready-to-paste block of all seven yaw/pitch
//     values (hand it to your dev, or paste into hotspots.config.js).
//
// Placements are held in localStorage on THIS machine so they survive refresh
// and you can preview them in normal mode — but they are local until the values
// are committed into hotspots.config.js and deployed. "Reset all" clears them.

import { HOTSPOTS } from "./hotspots.config.js";

const LS_KEY = "capstone.authoring.v1";
const round1 = (v) => Math.round(v * 10) / 10;

export class Authoring {
  constructor(viewer, hotspots, panelEl) {
    this.viewer = viewer;
    this.hotspots = hotspots;
    this.panel = panelEl;
    this.active = new URLSearchParams(location.search).get("edit") === "1";
    this.selectedId = null;
    this.lastClick = null;

    // Snapshot the config's original positions so "Reset all" can restore them.
    this.original = {};
    for (const h of HOTSPOTS) this.original[h.id] = { yaw: h.yaw, pitch: h.pitch };

    // Load any saved placements and apply them to the live hotspots.
    this.overrides = this._load();
    this._applyOverrides();

    // Toggle with "E" (ignored while typing in a field).
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "e") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      this.toggle();
    });

    // Clicking empty room places the selected hotspot (and always updates the
    // readout).
    this.viewer.onClick((yaw, pitch) => {
      this.lastClick = { yaw, pitch };
      if (this.active && this.selectedId) this._place(this.selectedId, yaw, pitch);
      else this._render();
    });

    // Wire edit hooks from the markers (select / live-drag / commit).
    this.hotspots.setEditHooks({
      onSelect: (h) => this.select(h.id),
      onMove: () => this._render(), // live numbers while dragging (no save)
      onCommit: (h) => {
        this._recordOverride(h.id, h.yaw, h.pitch, true);
        this._render();
      },
    });

    this._applyActive();
  }

  toggle() {
    this.active = !this.active;
    this._applyActive();
  }

  _applyActive() {
    document.body.classList.toggle("authoring", this.active);
    this.hotspots.setEditMode(this.active);
    this.panel.classList.toggle("hidden", !this.active);
    if (!this.active) this.hotspots.setSelected(null);
    else this._render();
  }

  select(id) {
    this.selectedId = id;
    this.hotspots.setSelected(id);
    this._render();
  }

  _place(id, yaw, pitch) {
    const h = HOTSPOTS.find((x) => x.id === id);
    if (!h) return;
    h.yaw = round1(yaw);
    h.pitch = round1(pitch);
    this._recordOverride(id, h.yaw, h.pitch, true);
    this._render();
  }

  _recordOverride(id, yaw, pitch, save) {
    this.overrides[id] = { yaw: round1(yaw), pitch: round1(pitch) };
    if (save) this._save();
  }

  resetAll() {
    this.overrides = {};
    for (const h of HOTSPOTS) {
      h.yaw = this.original[h.id].yaw;
      h.pitch = this.original[h.id].pitch;
    }
    this._save();
    this._render();
  }

  // ---- persistence ------------------------------------------------------

  _load() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  _save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.overrides));
    } catch {
      /* ignore */
    }
  }

  _applyOverrides() {
    for (const h of HOTSPOTS) {
      const o = this.overrides[h.id];
      if (o) {
        h.yaw = o.yaw;
        h.pitch = o.pitch;
      }
    }
  }

  // ---- export -----------------------------------------------------------

  _positionsJSON() {
    const out = {};
    for (const h of HOTSPOTS) out[h.id] = { yaw: round1(h.yaw), pitch: round1(h.pitch) };
    return JSON.stringify(out, null, 2);
  }

  _copy(text) {
    const done = () => this._flash("Copied to clipboard ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => this._fallbackCopy(text, done));
    } else {
      this._fallbackCopy(text, done);
    }
  }

  _fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch {
      this._flash("Copy failed — select the text below");
    }
    document.body.removeChild(ta);
  }

  _flash(msg) {
    const el = this.panel.querySelector(".ap-msg");
    if (el) {
      el.textContent = msg;
      clearTimeout(this._flashT);
      this._flashT = setTimeout(() => {
        if (el) el.textContent = "";
      }, 2000);
    }
  }

  // ---- render -----------------------------------------------------------

  _render() {
    if (!this.active) return;

    const rows = HOTSPOTS.map((h) => {
      const placed = !!this.overrides[h.id];
      const sel = h.id === this.selectedId ? " selected" : "";
      return `
        <li class="ap-row${sel}" data-id="${h.id}">
          <span class="ap-swatch role-${h.role}"></span>
          <span class="ap-label">${h.label}</span>
          <span class="ap-coords">${round1(h.yaw)}, ${round1(h.pitch)}</span>
          <span class="ap-badge">${placed ? "placed" : "default"}</span>
        </li>`;
    }).join("");

    const selName = this.selectedId
      ? (HOTSPOTS.find((h) => h.id === this.selectedId) || {}).label
      : null;
    const hint = selName
      ? `Selected <b>${selName}</b> — click in the room to place it, or drag its marker.`
      : `Select a hotspot below, then click in the room to place it.`;

    const click = this.lastClick
      ? `last click: yaw ${round1(this.lastClick.yaw)}, pitch ${round1(this.lastClick.pitch)}`
      : "";

    this.panel.innerHTML = `
      <div class="ap-head">
        <span class="ap-title">AUTHORING</span>
        <button class="ap-x" data-act="exit" title="Exit (E)">exit</button>
      </div>
      <div class="ap-hint">${hint}</div>
      <ul class="ap-list">${rows}</ul>
      <div class="ap-readout">${click}</div>
      <div class="ap-actions">
        <button data-act="copy">Copy positions</button>
        <button data-act="reset" class="ap-danger">Reset all</button>
      </div>
      <div class="ap-msg"></div>
    `;

    // Wire row selection.
    this.panel.querySelectorAll(".ap-row").forEach((row) => {
      row.addEventListener("click", () => this.select(row.dataset.id));
    });
    // Wire buttons.
    this.panel.querySelector('[data-act="exit"]').addEventListener("click", () => this.toggle());
    this.panel.querySelector('[data-act="copy"]').addEventListener("click", () =>
      this._copy(this._positionsJSON())
    );
    this.panel.querySelector('[data-act="reset"]').addEventListener("click", () => {
      if (confirm("Reset all hotspot positions back to the config defaults?")) this.resetAll();
    });
  }
}
