// interactions.js
//
// The popup / modal and its checkbox-completion logic. Opening a popup fires an
// "experienced" statement; checking the box marks the hotspot complete, fires a
// "completed" statement, updates gating (so newly unlocked hotspots appear),
// and — if the FINAL hotspot just completed — also fires a course-level
// "completed" statement.

import { ACTIVITY_BASE } from "./hotspots.config.js";
import { isComplete, markComplete } from "./state.js";
import { areAllCoreComplete } from "./gating.js";
import { sendExperienced, sendCompleted, sendCourseCompleted } from "./xapi.js";
import { renderAcademicVideos } from "./academicVideos.js";

function activityIdFor(hotspot) {
  return `${ACTIVITY_BASE}/${hotspot.id}`;
}

export class Interactions {
  constructor({ onCompleted } = {}) {
    this.onCompleted = onCompleted || (() => {});

    this.backdrop = document.getElementById("modal-backdrop");
    this.titleEl = document.getElementById("modal-title");
    this.bodyEl = document.getElementById("modal-body");
    this.completeRow = document.querySelector(".modal-complete");
    this.checkbox = document.getElementById("modal-complete-checkbox");
    this.statusEl = document.getElementById("modal-status");
    this.closeBtn = document.getElementById("modal-close");

    this._current = null; // hotspot currently open

    this.closeBtn.addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.backdrop.classList.contains("hidden")) {
        this.close();
      }
    });
    this.checkbox.addEventListener("change", () => this._onCheck());
  }

  open(hotspot) {
    this._current = hotspot;
    this.titleEl.textContent = hotspot.label;

    if (hotspot.type === "videos") {
      // Custom Academic Overview popup: grade selector + video list drive
      // completion, so hide the generic checkbox row and status line.
      this.completeRow.style.display = "none";
      this.statusEl.style.display = "none";
      renderAcademicVideos(this.bodyEl, hotspot, {
        onComplete: () => this._complete(hotspot),
      });
    } else {
      // Generic popup: body copy + a "mark complete" checkbox.
      this.completeRow.style.display = "";
      this.statusEl.style.display = "";
      this.bodyEl.innerHTML = hotspot.body || "<p>(placeholder content)</p>";

      const already = isComplete(hotspot.id);
      this.checkbox.checked = already;
      this.checkbox.disabled = already; // can't un-complete in this shell
      this.statusEl.textContent = already ? "Completed ✓" : "";
      this.statusEl.classList.toggle("done", already);
    }

    this.backdrop.classList.remove("hidden");

    // Fire "experienced" each time the popup opens.
    sendExperienced(activityIdFor(hotspot), hotspot.label);
  }

  close() {
    this.backdrop.classList.add("hidden");
    this._current = null;
  }

  _onCheck() {
    const hotspot = this._current;
    if (!hotspot || !this.checkbox.checked) return;
    this._complete(hotspot);
  }

  // Mark a hotspot complete: persist, fire xAPI, reflect in the modal, and let
  // the app update gating/markers/HUD. Used by both the generic checkbox and
  // the Academic Overview video flow.
  _complete(hotspot) {
    if (isComplete(hotspot.id)) return;

    markComplete(hotspot.id);
    sendCompleted(activityIdFor(hotspot), hotspot.label);
    if (hotspot.role === "final") sendCourseCompleted();

    // Reflect completed state on the generic checkbox/status (harmless/hidden
    // for the video popup, which shows its own completion banner).
    this.checkbox.disabled = true;
    this.checkbox.checked = true;
    this.statusEl.textContent = "Completed ✓";
    this.statusEl.classList.add("done");

    this.onCompleted(hotspot);
  }
}

// Re-exported so main can check whether finishing core unlocked final, if it
// wants to surface a message. (Not required, but handy.)
export { areAllCoreComplete };
