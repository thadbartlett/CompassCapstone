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

function activityIdFor(hotspot) {
  return `${ACTIVITY_BASE}/${hotspot.id}`;
}

export class Interactions {
  constructor({ onCompleted } = {}) {
    this.onCompleted = onCompleted || (() => {});

    this.backdrop = document.getElementById("modal-backdrop");
    this.titleEl = document.getElementById("modal-title");
    this.bodyEl = document.getElementById("modal-body");
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
    this.bodyEl.innerHTML = hotspot.body || "<p>(placeholder content)</p>";

    const already = isComplete(hotspot.id);
    this.checkbox.checked = already;
    this.checkbox.disabled = already; // can't un-complete in this shell
    this.statusEl.textContent = already ? "Completed ✓" : "";
    this.statusEl.classList.toggle("done", already);

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
    if (isComplete(hotspot.id)) return;

    // 1) Persist completion.
    markComplete(hotspot.id);

    // 2) xAPI "completed" for this activity.
    sendCompleted(activityIdFor(hotspot), hotspot.label);

    // 3) If this was the FINAL hotspot, also send course-level completed.
    if (hotspot.role === "final") {
      sendCourseCompleted();
    }

    // 4) Reflect completed state in the modal.
    this.checkbox.disabled = true;
    this.statusEl.textContent = "Completed ✓";
    this.statusEl.classList.add("done");

    // 5) Let the app update gating / markers / HUD.
    this.onCompleted(hotspot);
  }
}

// Re-exported so main can check whether finishing core unlocked final, if it
// wants to surface a message. (Not required, but handy.)
export { areAllCoreComplete };
