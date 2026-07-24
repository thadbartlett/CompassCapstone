// imageMap.js
//
// Renders an "image map" interaction: a large reference image with clickable
// hotspots positioned over it (used by Anchored at Home). Clicking a hotspot
// opens that section's content in a side panel; opened hotspots get a check.
// After all sections are opened, a closing summary + Finish appears, which
// completes the hotspot.
//
// - Wide layout (the modal is widened by interactions.js for this type).
// - Narrow screens fall back to a stacked card list (CSS-toggled); both the
//   markers and the cards drive the same "opened" state.
// - Placement helper: open with ?edit=1 to reposition the hotspots — select a
//   section, click the image to place it, then "Copy positions" to paste the
//   coordinates back into imageMap.config.js. Placements persist in
//   localStorage while you work.
//
// The DOM is built once and updated in place so the large image is never
// reloaded mid-interaction.

import { IMAGE_MAPS } from "./imageMap.config.js";
import { isComplete } from "./state.js";

const round1 = (v) => Math.round(v * 10) / 10;

export function renderImageMap(container, hotspot, { onComplete }) {
  const cfg = IMAGE_MAPS[hotspot.id];
  if (!cfg) {
    container.innerHTML = "<p>(No image map is configured for this section.)</p>";
    return;
  }
  const sections = cfg.sections;
  const reviewMode = isComplete(hotspot.id);

  const opened = new Set();
  // Placement helper uses its OWN param (?editmap=1), separate from the room's
  // ?edit=1 authoring — otherwise room-edit mode would block opening this popup.
  const authoring = new URLSearchParams(location.search).get("editmap") === "1";
  const LS_KEY = `capstone.imgmap.${hotspot.id}`;
  let overrides = loadOverrides();
  let authSelected = null;

  function loadOverrides() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveOverrides() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(overrides));
    } catch {
      /* ignore */
    }
  }
  function coordFor(s) {
    return overrides[s.id] || { x: s.x, y: s.y };
  }

  // ---- build DOM once ---------------------------------------------------

  const markers = sections
    .map((s, k) => {
      const c = coordFor(s);
      return `
        <button type="button" class="imgmap-hot" data-id="${s.id}" style="left:${c.x}%;top:${c.y}%">
          <span class="imgmap-hot-dot" data-num="${k + 1}">${k + 1}</span>
          <span class="imgmap-hot-label">${s.title}</span>
        </button>`;
    })
    .join("");

  const cards = sections
    .map(
      (s, k) => `
      <li class="imgmap-card" data-id="${s.id}" role="button" tabindex="0">
        <div class="imgmap-card-head">
          <span class="imgmap-card-num" data-num="${k + 1}">${k + 1}</span>
          <span class="imgmap-card-title">${s.title}</span>
          <span class="imgmap-card-chev">&#9654;</span>
        </div>
        <div class="imgmap-card-body">${s.body}</div>
      </li>`
    )
    .join("");

  const authBar = authoring
    ? `
      <div class="imgmap-auth">
        <div class="imgmap-auth-title">PLACEMENT HELPER</div>
        <div class="imgmap-auth-row">
          ${sections
            .map((s) => `<button type="button" class="imgmap-auth-sel" data-id="${s.id}">${s.title}</button>`)
            .join("")}
        </div>
        <div class="imgmap-auth-hint">Select a section, then click the image to place its hotspot.</div>
        <div class="imgmap-auth-readout"></div>
        <button type="button" class="imgmap-auth-copy">Copy positions</button>
        <div class="imgmap-auth-msg"></div>
      </div>`
    : "";

  container.innerHTML = `
    <div class="imgmap-intro">${cfg.intro || ""}</div>
    ${authBar}
    <div class="imgmap-prompt">${cfg.prompt || ""}</div>
    <div class="imgmap-progress"></div>
    <div class="imgmap-stage">
      <div class="imgmap-imgwrap">
        <img class="imgmap-img" src="${cfg.imageSrc}" alt="Anchored at Home weekly page" />
        ${markers}
        <div class="imgmap-panel" hidden>
          <button type="button" class="imgmap-panel-close" aria-label="Close">&times;</button>
          <h3 class="imgmap-panel-title"></h3>
          <div class="imgmap-panel-body"></div>
        </div>
      </div>
    </div>
    <ul class="imgmap-cards">${cards}</ul>
    <div class="imgmap-summary" hidden>${cfg.summary || ""}</div>
    <div class="imgmap-footer">
      <button type="button" class="imgmap-finish" disabled>Finish</button>
    </div>`;

  // Element refs.
  const imgwrap = container.querySelector(".imgmap-imgwrap");
  if (authoring) imgwrap.classList.add("authoring");
  const img = container.querySelector(".imgmap-img");
  const panel = container.querySelector(".imgmap-panel");
  const panelTitle = container.querySelector(".imgmap-panel-title");
  const panelBody = container.querySelector(".imgmap-panel-body");
  const progressEl = container.querySelector(".imgmap-progress");
  const summaryEl = container.querySelector(".imgmap-summary");
  const finishBtn = container.querySelector(".imgmap-finish");

  // ---- state updates ----------------------------------------------------

  function paintOpened(id) {
    const k = sections.findIndex((s) => s.id === id);
    container.querySelectorAll(`.imgmap-hot[data-id="${id}"], .imgmap-card[data-id="${id}"]`).forEach((el) => {
      el.classList.add("opened");
      const dot = el.querySelector(".imgmap-hot-dot, .imgmap-card-num");
      if (dot) dot.innerHTML = "&#10003;";
    });
  }

  function updateProgress() {
    const n = opened.size;
    const total = sections.length;
    progressEl.textContent =
      n >= total ? "" : `Opened ${n} of ${total} sections`;
  }

  function openPanel(id) {
    const s = sections.find((x) => x.id === id);
    panelTitle.textContent = s.title;
    panelBody.innerHTML = s.body;
    panel.hidden = false;
    panel.classList.add("open");
    container.querySelectorAll(".imgmap-hot").forEach((m) =>
      m.classList.toggle("active", m.dataset.id === id)
    );
  }
  function closePanel() {
    panel.hidden = true;
    panel.classList.remove("open");
    container.querySelectorAll(".imgmap-hot.active").forEach((m) => m.classList.remove("active"));
  }

  function openSection(id, viaPanel) {
    opened.add(id);
    paintOpened(id);
    if (viaPanel) openPanel(id);
    else container.querySelector(`.imgmap-card[data-id="${id}"]`).classList.add("open");
    updateProgress();
    maybeComplete();
  }

  function maybeComplete() {
    if (opened.size < sections.length) return;
    summaryEl.hidden = false;
    if (isComplete(hotspot.id)) {
      finishBtn.disabled = true;
      finishBtn.innerHTML = "Completed &#10003;";
    } else {
      finishBtn.disabled = false;
    }
  }

  // ---- wire interactions ------------------------------------------------

  container.querySelectorAll(".imgmap-hot").forEach((m) => {
    m.addEventListener("click", (e) => {
      if (authoring) {
        e.stopPropagation();
        selectAuth(m.dataset.id);
      } else {
        openSection(m.dataset.id, true);
      }
    });
  });

  container.querySelectorAll(".imgmap-card").forEach((c) => {
    const open = () => openSection(c.dataset.id, false);
    c.addEventListener("click", open);
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  container.querySelector(".imgmap-panel-close").addEventListener("click", closePanel);

  finishBtn.addEventListener("click", () => {
    if (opened.size < sections.length) return;
    if (!isComplete(hotspot.id)) onComplete();
    finishBtn.disabled = true;
    finishBtn.innerHTML = "Completed &#10003;";
  });

  // ---- authoring (placement helper) -------------------------------------

  function selectAuth(id) {
    authSelected = id;
    container.querySelectorAll(".imgmap-auth-sel").forEach((b) =>
      b.classList.toggle("sel", b.dataset.id === id)
    );
  }

  if (authoring) {
    container.querySelectorAll(".imgmap-auth-sel").forEach((b) => {
      b.addEventListener("click", () => selectAuth(b.dataset.id));
    });
    imgwrap.addEventListener("click", (e) => {
      // Ignore clicks that land on a marker (handled above with stopPropagation).
      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // image not sized yet
      const clamp = (v) => Math.min(100, Math.max(0, v));
      const x = round1(clamp(((e.clientX - rect.left) / rect.width) * 100));
      const y = round1(clamp(((e.clientY - rect.top) / rect.height) * 100));
      const readout = container.querySelector(".imgmap-auth-readout");
      readout.textContent = `clicked: x ${x}, y ${y}` + (authSelected ? ` → ${authSelected}` : "");
      if (authSelected) {
        overrides[authSelected] = { x, y };
        saveOverrides();
        const mk = container.querySelector(`.imgmap-hot[data-id="${authSelected}"]`);
        if (mk) {
          mk.style.left = `${x}%`;
          mk.style.top = `${y}%`;
        }
      }
    });
    container.querySelector(".imgmap-auth-copy").addEventListener("click", () => {
      const out = {};
      for (const s of sections) out[s.id] = coordFor(s);
      const text = JSON.stringify(out, null, 2);
      // Always show the positions in a selectable box (clipboard may be blocked),
      // and also attempt to copy to the clipboard.
      const msg = container.querySelector(".imgmap-auth-msg");
      msg.innerHTML = `<textarea class="imgmap-auth-out" readonly rows="9"></textarea>`;
      const ta = msg.querySelector(".imgmap-auth-out");
      ta.value = text;
      ta.focus();
      ta.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    });
  }

  // ---- initial state ----------------------------------------------------

  updateProgress();
  if (reviewMode) {
    sections.forEach((s) => {
      opened.add(s.id);
      paintOpened(s.id);
    });
    updateProgress();
    maybeComplete();
  }
}
