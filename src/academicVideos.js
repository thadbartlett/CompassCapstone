// academicVideos.js
//
// Renders the custom Academic Overview popup: a grade selector plus the full
// video list. All videos are viewable; the ones matching the learner's selected
// grades are flagged "Required". Clicking a video's "Watch" button reveals an
// embedded Vimeo player INLINE (ad-free, no leaving the orientation) AND counts
// it as watched on first open — no attestation, no run-time check. When every
// REQUIRED video has been watched (and at least one grade is selected), the
// section completes via the onComplete callback.
//
// Per-video xAPI: opening a video sends a `completed` statement for that video's
// activity, so reporting shows exactly which videos each parent watched.
//
// Rendering note: the video rows are NOT fully re-rendered when a video is
// opened (that would reload/interrupt any playing iframe). Opening a video does
// targeted DOM updates instead; only grade changes trigger a full re-render.

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

// Derive the Vimeo embed URL from a Vimeo page link. Handles:
//   https://vimeo.com/1234567            -> player.vimeo.com/video/1234567
//   https://vimeo.com/1234567/abcdef     -> ...?h=abcdef  (unlisted privacy hash)
//   https://vimeo.com/1234567?share=...  -> query ignored
function vimeoEmbedUrl(url) {
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (!m) return null;
  const [, id, hash] = m;
  const params = new URLSearchParams({ title: "0", byline: "0", portrait: "0", dnt: "1" });
  if (hash) params.set("h", hash);
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

export function renderAcademicVideos(container, hotspot, { onComplete }) {
  function reqInfo() {
    const { grades, watched } = getAcademicOverview();
    const req = requiredVideoIds(grades);
    const done = [...req].filter((id) => watched[id]).length;
    return { grades, watched, req, total: req.size, done };
  }

  function statusHTML() {
    const { grades, total, done } = reqInfo();
    if (isComplete(hotspot.id))
      return `<div class="ao-status done">&#10003; Academic Overview complete</div>`;
    if (grades.length === 0)
      return `<div class="ao-status warn">Select at least one grade above to see which videos you need.</div>`;
    return `<div class="ao-status">${done} of ${total} required videos watched</div>`;
  }

  function updateStatus() {
    const el = container.querySelector(".ao-status");
    if (el) el.outerHTML = statusHTML();
  }

  function maybeComplete() {
    if (isComplete(hotspot.id)) return;
    const { grades, watched, req } = reqInfo();
    if (grades.length && req.size && [...req].every((id) => watched[id])) {
      onComplete(); // interactions marks the section complete + fires statement
      updateStatus();
    }
  }

  function toggleVideo(v, row) {
    const embed = row.querySelector(".ao-embed");
    const btn = row.querySelector(".ao-watch");
    const opening = embed.hasAttribute("hidden");

    if (opening) {
      if (!embed.firstChild) {
        const src = vimeoEmbedUrl(v.url);
        embed.innerHTML = src
          ? `<iframe src="${src}&autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
             <a class="ao-openext" href="${v.url}" target="_blank" rel="noopener">Open on Vimeo &#8599;</a>`
          : `<a class="ao-openext" href="${v.url}" target="_blank" rel="noopener">Open video &#8599;</a>`;
      }
      embed.removeAttribute("hidden");
      row.classList.add("expanded");
      btn.textContent = "Hide";

      // First open counts as watched.
      if (!getAcademicOverview().watched[v.id]) {
        markVideoWatched(v.id);
        sendCompleted(videoActivityId(v.id), v.label);
        row.classList.add("watched");
        const chk = row.querySelector(".ao-check");
        if (chk) chk.innerHTML = "&#10003;";
        updateStatus();
        maybeComplete();
      }
    } else {
      embed.setAttribute("hidden", "");
      embed.innerHTML = ""; // remove iframe to stop playback
      row.classList.remove("expanded");
      btn.textContent = getAcademicOverview().watched[v.id] ? "Watch again" : "Watch";
    }
  }

  function render() {
    const { grades, watched, req } = reqInfo();

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
        <li class="ao-video${isReq ? " required" : ""}${isW ? " watched" : ""}" data-id="${v.id}">
          <div class="ao-video-head">
            <span class="ao-check" aria-hidden="true">${isW ? "&#10003;" : ""}</span>
            <span class="ao-vlabel">${v.label}${
        isReq ? ' <span class="ao-badge">Required</span>' : ""
      }</span>
            <button type="button" class="ao-watch">${isW ? "Watch again" : "Watch"}</button>
          </div>
          <div class="ao-embed" hidden></div>
        </li>`;
    }).join("");

    container.innerHTML = `
      <p class="ao-intro">Select the grade(s) you have students in, then click
      Watch to play each required video right here. Every video is available —
      only the ones matching your students' grades are required to complete this
      section.</p>
      <div class="ao-grades-label">Grade(s) of your students:</div>
      <div class="ao-grades">${gradeBoxes}</div>
      ${statusHTML()}
      <ul class="ao-videos">${rows}</ul>
    `;

    // Grade checkboxes -> full re-render (required flags change).
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

    // Watch buttons -> targeted reveal/collapse (no full re-render).
    container.querySelectorAll(".ao-video").forEach((row) => {
      const v = VIDEOS.find((x) => x.id === row.dataset.id);
      row.querySelector(".ao-watch").addEventListener("click", () => toggleVideo(v, row));
    });
  }

  render();
  maybeComplete(); // handle reopening when the required set is already satisfied
}
