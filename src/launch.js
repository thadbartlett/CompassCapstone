// launch.js
//
// Name/email gate that establishes learner identity. Because there is no LMS,
// we ask the learner who they are on first load, store it, and use the email
// to form the xAPI actor (mbox = mailto:<email>). A returning learner (identity
// already known this session) skips straight past this screen. Identity lives
// in sessionStorage, so a new session (or a shared machine after the tab
// closes) asks again.

import { getIdentity, setIdentity, hasIdentity } from "./state.js";

export class Launch {
  constructor({ onEnter } = {}) {
    this.onEnter = onEnter || (() => {});
    this.screen = document.getElementById("launch-screen");
    this.form = document.getElementById("launch-form");
    this.nameInput = document.getElementById("launch-name");
    this.emailInput = document.getElementById("launch-email");

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

  _onSubmit(e) {
    e.preventDefault();
    const name = this.nameInput.value.trim();
    // Normalize the email: it's the learner's xAPI identity (mbox), so trim and
    // lowercase it. That way "Bob@Email.com" and "bob@email.com" resolve to the
    // SAME learner and progress resumes regardless of how they typed it.
    const email = this.emailInput.value.trim().toLowerCase();
    if (!name || !email) return;

    setIdentity({ name, email });
    this._hide();
    this.onEnter({ name, email });
  }

  _hide() {
    this.screen.classList.add("hidden");
  }
}
