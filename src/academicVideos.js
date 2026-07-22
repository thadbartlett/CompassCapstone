// academicVideos.js
//
// Renders the custom Academic Overview popup: a grade selector plus the full
// video list. All videos are viewable; the ones matching the learner's selected
// grades are flagged "Required". Clicking a video's link opens it (new tab) AND
// counts as watched — no attestation, no run-time check. When every REQUIRED
// video has been watched (and at least one grade is selected), the section
// completes via the onComplete callback.
//
// Per-video xAPI: each click sends a `completed` statement for that video's
// activity, so reporting shows exactly which videos each parent watched.

import { VIDEOS, GRADES, requiredVideoIds } from "./videos.config.js";
import { ACTIVITY_BASE } from "./hotspots.config.js";
import {
  getAcademicOverview,
  setGrades,
  markVideoWatched,
  isComplete,
} from "./state.js";
import { sendCompleted } from "./xapi.js";

function videoActivityId(id) {
  return `${ACTIVITY_BASE}/academic-overview/video/${id}`;
}

export function renderAcademicVideos(container, hotspot, { onComplete }) {
  function maybeComplete() {
    if (isComplete(hotspot.id)) return;
    const { grades, watched } = getAcademicOverview();
    if (grades.length === 0) return;
    const req = requiredVideoIds(grades);
    if (req.size > 0 && [...req].every((id) => watched[id])) {
      onComplete(); // interactions marks the section complete + fires statement
      render(); // re-render to show the completed banner
    }
  }

  function render() {
    const { grades, watched } = getAcademicOverview();
    const req = requiredVideoIds(grades);
    const reqTotal = req.size;
    const reqDone = [...req].filter((id) => watched[id]).length;
    const sectionDone = isComplete(hotspot.id);

    const gradeBoxes = GRADES.map(
      (g) => `
        <label class="ao-grade${grades.includes(g) ? " on" : ""}">
          <input type="checkbox" value="${g}" ${grades.includes(g) ? "checked" : ""} />
          <span>${g}th</span>
        </label>`
    ).join("");

    const rows = VIDEOS.map((v) => {
      const isReq = req.has(v.id);
      const isW = !!watched[v.id];
      return `
        <li class="ao-video${isReq ? " required" : ""}${isW ? " watched" : ""}">
          <span class="ao-check" aria-hidden="true">${isW ? "&#10003;" : ""}</span>
          <span class="ao-vlabel">${v.label}${
        isReq ? ' <span class="ao-badge">Required</span>' : ""
      }</span>
          <a class="ao-watch" href="${v.url}" target="_blank" rel="noopener" data-id="${v.id}">Watch &#9654;</a>
        </li>`;
    }).join("");

    const status = sectionDone
      ? `<div class="ao-status done">&#10003; Academic Overview complete</div>`
      : grades.length === 0
      ? `<div class="ao-status warn">Select at least one grade above to see which videos you need.</div>`
      : `<div class="ao-status">${reqDone} of ${reqTotal} required videos watched</div>`;

    container.innerHTML = `
      <p class="ao-intro">Select the grade(s) you have students in, then watch the
      required videos below. Every video is available to watch — only the ones
      matching your students' grades are required to complete this section.</p>
      <div class="ao-grades-label">Grade(s) of your students:</div>
      <div class="ao-grades">${gradeBoxes}</div>
      ${status}
      <ul class="ao-videos">${rows}</ul>
    `;

    // Grade checkboxes.
    container.querySelectorAll(".ao-grades input").forEach((cb) => {
      cb.addEventListener("change", () => {
        const picked = [...container.querySelectorAll(".ao-grades input:checked")].map(
          (c) => Number(c.value)
        );
        setGrades(picked);
        render();
        maybeComplete();
      });
    });

    // Watch links: let the new tab open, then record the click as watched.
    container.querySelectorAll(".ao-watch").forEach((a) => {
      a.addEventListener("click", () => {
        const id = a.dataset.id;
        setTimeout(() => {
          const v = VIDEOS.find((x) => x.id === id);
          markVideoWatched(id);
          sendCompleted(videoActivityId(id), v ? v.label : id);
          render();
          maybeComplete();
        }, 0);
      });
    });
  }

  render();
  maybeComplete(); // handle reopening when the required set is already satisfied
}
