// launch.js
//
// Name/email gate that establishes learner identity. Because there is no LMS,
// we ask the learner who they are on first load, store it, and use the email
// to form the xAPI actor (mbox = mailto:<email>). A returning learner (identity
// already known this session) skips straight past this screen. Identity lives
// in sessionStorage, so a new session (or a shared machine after the tab
// closes) asks again.

import { getIdentity, setIdentity, hasIdentity } from "./state.js";
import { resolveCanonicalName } from "./xapiProfile.js";

export class Launch {
  constructor({ onEnter } = {}) {
    this.onEnter = onEnter || (() => {});
    this.screen = document.getElementById("launch-screen");
    this.form = document.getElementById("launch-form");
    this.nameInput = document.getElementById("launch-name");
    this.emailInput = document.getElementById("launch-email");
    this.submitBtn = this.form.querySelector('button[type="submit"]');
    this._submitting = false;

    this.form.addEventListener("submit", (e) => this._onSubmit(e));
  }

  // If we already know the learner, hide the gate and enter immediately.
  start() {
    if (hasIdentity()) {
      const id = getIdentity();
      this._hide();
      this.onEnter(id);
      return true;
    }
    // Prefill if a partial identity exists.
    const existing = getIdentity();
    if (existing) {
      this.nameInput.value = existing.name || "";
      this.emailInput.value = existing.email || "";
    }
    return false;
  }

  async _onSubmit(e) {
    e.preventDefault();
    if (this._submitting) return;
    const typedName = this.nameInput.value.trim();
    // Normalize the email: it's the learner's xAPI identity (mbox), so trim and
    // lowercase it. That way "Bob@Email.com" and "bob@email.com" resolve to the
    // SAME learner and progress resumes regardless of how they typed it.
    const email = this.emailInput.value.trim().toLowerCase();
    if (!typedName || !email) return;

    // "First name wins": ask the LRS for the canonical name on file for this
    // email. If one exists it wins; otherwise the typed name becomes canonical.
    // Involves one quick round trip, so disable the button meanwhile.
    this._submitting = true;
    const originalLabel = this.submitBtn.textContent;
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = "Signing in…";

    const name = await resolveCanonicalName(typedName, email);

    this.submitBtn.disabled = false;
    this.submitBtn.textContent = originalLabel;
    this._submitting = false;

    setIdentity({ name, email });
    this._hide();
    this.onEnter({ name, email });
  }

  _hide() {
    this.screen.classList.add("hidden");
  }
}
