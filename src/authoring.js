// authoring.js
//
// AUTHORING MODE — the tool for placing hotspots.
//
// You (the author) can't hand me pixel coordinates because I can't see your
// image. So: enable authoring mode, click any object in the panorama, and this
// prints the exact { yaw, pitch } (degrees) and normalized direction vector of
// that point — both to an on-screen readout AND to the browser console — ready
// to paste into hotspots.config.js.
//
// Toggle it two ways:
//   - Add ?edit=1 to the URL, or
//   - Press the "E" key while inside the experience.

export class Authoring {
  constructor(viewer, readoutEl) {
    this.viewer = viewer;
    this.readoutEl = readoutEl;
    this.active = new URLSearchParams(location.search).get("edit") === "1";

    // Toggle with the "E" key (ignored while typing in a field).
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "e") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      this.toggle();
    });

    // Report every panorama click while active.
    this.viewer.onClick((yaw, pitch, dir) => {
      if (!this.active) return;
      this._report(yaw, pitch, dir);
    });

    this._applyVisibility();
  }

  toggle() {
    this.active = !this.active;
    this._applyVisibility();
    if (!this.active) this.readoutEl.classList.add("hidden");
    else this._showHint();
  }

  _applyVisibility() {
    document.body.classList.toggle("authoring", this.active);
    if (this.active) this._showHint();
    else this.readoutEl.classList.add("hidden");
  }

  _showHint() {
    this.readoutEl.classList.remove("hidden");
    this.readoutEl.innerHTML = `
      <div class="ar-title">AUTHORING MODE — on</div>
      <div class="ar-hint">Click any object to read its position. Press "E" to exit.</div>
    `;
  }

  _report(yaw, pitch, dir) {
    const y = yaw.toFixed(1);
    const p = pitch.toFixed(1);
    const vx = dir.x.toFixed(3);
    const vy = dir.y.toFixed(3);
    const vz = dir.z.toFixed(3);

    const snippet = `yaw: ${y}, pitch: ${p},`;

    this.readoutEl.classList.remove("hidden");
    this.readoutEl.innerHTML = `
      <div class="ar-title">AUTHORING MODE — clicked point</div>
      <div class="ar-row"><b>yaw</b> ${y}&deg; &nbsp; <b>pitch</b> ${p}&deg;</div>
      <div class="ar-row ar-vec">dir = (${vx}, ${vy}, ${vz})</div>
      <div class="ar-copy">Paste into hotspots.config.js:</div>
      <code class="ar-code">${snippet}</code>
      <div class="ar-hint">Also logged to console. Press "E" to exit.</div>
    `;

    // Console output (easy to copy).
    console.log(
      `%c[authoring] yaw: ${y}, pitch: ${p}  dir=(${vx}, ${vy}, ${vz})`,
      "color:#7cf;font-weight:bold"
    );
    console.log({ yaw: Number(y), pitch: Number(p), dir: { x: dir.x, y: dir.y, z: dir.z } });
  }
}
