// linear.js
//
// Renders a multi-screen "linear" learning interaction (used by the Welcome
// hotspot). Screens are defined in linear.config.js; each has a `kind`:
//   choice | cards | question | reveal   (see that file for shapes).
//
// Behavior:
//   - One screen at a time with Back / Continue navigation (Back allowed).
//   - Continue is gated per screen: choice needs a selection; cards need all
//     cards opened; question needs the correct answer; reveal needs its panel
//     opened.
//   - The final screen's Continue becomes "Finish" and calls onComplete (which
//     marks the hotspot complete + sends the xAPI completed statement) — so
//     completion fires only after all screens.
//   - Per-screen state is kept in memory for the session, so navigating Back
//     shows a screen exactly as the parent left it. Closing and reopening
//     restarts at screen 1 (only final completion is persisted).
//   - xAPI reuses the shared helpers: the scored question sends `answered`
//     (success + response); the Screen 1 choice sends an unscored `responded`.
//     Reopening after completion runs in review mode and sends nothing.

import { LINEAR } from "./linear.config.js";
import { ACTIVITY_BASE } from "./hotspots.config.js";
import { isComplete } from "./state.js";
import { sendAnswered, sendResponded } from "./xapi.js";

// Simple decorative inline SVG icons (stroke = currentColor).
const ICONS = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-3 5-5 3 3-5z" fill="currentColor" stroke="none"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  book: '<path d="M12 6c-2-1.4-5-1.4-7 0v12c2-1.4 5-1.4 7 0 2-1.4 5-1.4 7 0V6c-2-1.4-5-1.4-7 0z"/><path d="M12 6v12"/>',
  branch: '<circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M12 7v4M12 11H6v6M12 11h6v6"/>',
  chat: '<path d="M4 5h16v11H9l-4 3v-3H4z"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M5 13a7 7 0 0 0 14 0M4 13H3M21 13h-1"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
  scales: '<path d="M12 4v16M6 20h12M4 8h16"/><path d="M8 8l-3 6a3 3 0 0 0 6 0zM16 8l3 6a3 3 0 0 1-6 0z"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z"/><path d="M12 13c0-4 3-6 6-6 0 4-3 6-6 6z"/>',
  music: '<path d="M9 17V4l11-2v13"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/>',
  art: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M3 16l5-4 4 3 3-3 6 5"/>',
  pen: '<path d="M4 20l3.5-1L18 8.5 15.5 6 5 16.5z"/><path d="M14 7l3 3"/>',
  people: '<circle cx="8" cy="8" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M14.5 20a5 5 0 0 1 7-4.3"/>',
};

function icon(name) {
  const g = ICONS[name];
  if (!g) return "";
  return `<svg class="lin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
}

// Larger decorative graphics used as click-to-reveal triggers.
const IMAGES = {
  // A ring binder with colored subject tabs (History/Latin/Rhetoric/English).
  binder: `
    <svg class="lin-binder" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="12" y="14" width="196" height="144" rx="10" fill="#22314f"/>
      <rect x="42" y="22" width="150" height="128" rx="3" fill="#f7f7f4"/>
      <line x1="56" y1="22" x2="56" y2="150" stroke="#e2a3a3" stroke-width="1.3"/>
      <g stroke="#dbe4ec" stroke-width="1.4">
        <line x1="60" y1="40" x2="184" y2="40"/><line x1="60" y1="56" x2="184" y2="56"/>
        <line x1="60" y1="72" x2="184" y2="72"/><line x1="60" y1="88" x2="184" y2="88"/>
        <line x1="60" y1="104" x2="184" y2="104"/><line x1="60" y1="120" x2="184" y2="120"/>
        <line x1="60" y1="136" x2="184" y2="136"/>
      </g>
      <g stroke="#c4c8ce" stroke-width="3">
        <circle cx="42" cy="48" r="8"/><circle cx="42" cy="86" r="8"/><circle cx="42" cy="124" r="8"/>
      </g>
      <g font-family="system-ui,sans-serif" font-size="8" font-weight="700" fill="#28303a" text-anchor="middle">
        <rect x="180" y="26" width="52" height="26" rx="4" fill="#f2d06b"/><text x="206" y="42">History</text>
        <rect x="180" y="58" width="52" height="26" rx="4" fill="#9ccf6b"/><text x="206" y="74">Latin</text>
        <rect x="180" y="90" width="52" height="26" rx="4" fill="#6bb7e0"/><text x="206" y="106">Rhetoric</text>
        <rect x="180" y="122" width="52" height="26" rx="4" fill="#b79bd6"/><text x="206" y="138">English</text>
      </g>
    </svg>`,
};

export function renderLinear(container, hotspot, { onComplete }) {
  const flow = LINEAR[hotspot.id];
  if (!flow) {
    container.innerHTML = "<p>(No interaction is configured for this section.)</p>";
    return;
  }
  const screens = flow.screens;
  const N = screens.length;
  const reviewMode = isComplete(hotspot.id);

  // Per-screen session state.
  const st = screens.map((s) => {
    if (s.kind === "choice") return { selected: reviewMode ? s.options[0] : null };
    if (s.kind === "cards") return { opened: new Set(reviewMode ? s.cards.map((_, i) => i) : []) };
    if (s.kind === "question") return { answeredCorrect: reviewMode, wrong: new Set() };
    if (s.kind === "reveal") return { revealed: reviewMode };
    return {};
  });

  let i = 0; // current screen index

  function met(idx) {
    const s = screens[idx];
    const state = st[idx];
    if (s.kind === "choice") return state.selected != null;
    if (s.kind === "cards") return state.opened.size === s.cards.length;
    if (s.kind === "question") return state.answeredCorrect;
    if (s.kind === "reveal") return state.revealed;
    return true;
  }

  function activityId(suffix) {
    return `${ACTIVITY_BASE}/${hotspot.id}/${suffix}`;
  }

  // ---- screen body renderers -------------------------------------------

  function choiceBody(s, state) {
    const opts = s.options
      .map((text, k) => {
        const sel = state.selected === text ? " selected" : "";
        return `<button type="button" class="lin-choice${sel}" data-k="${k}">${text}</button>`;
      })
      .join("");
    const after = state.selected != null ? `<div class="lin-after">${s.afterMessage}</div>` : "";
    return `
      <div class="lin-intro">${s.intro || ""}</div>
      <div class="lin-prompt">${s.prompt}</div>
      <div class="lin-choices">${opts}</div>
      ${after}`;
  }

  function cardsBody(s, state) {
    const img = s.imageSrc
      ? `<img class="lin-cards-photo" src="${s.imageSrc}" alt="" />`
      : "";
    const instruct = s.imagePrompt
      ? `<div class="lin-cards-instruct">${s.imagePrompt}</div>`
      : "";
    // Cards are clickable DIVs (not buttons) so their bodies can hold rich HTML.
    const cards = s.cards
      .map((c, k) => {
        const open = state.opened.has(k);
        return `
          <div class="lin-card${open ? " open" : ""}" data-k="${k}" role="button" tabindex="0" aria-expanded="${open}">
            <div class="lin-card-head">${icon(c.icon)}<span class="lin-card-title">${c.title}</span>
              <span class="lin-card-chev">${open ? "&#9660;" : "&#9654;"}</span></div>
            ${open ? `<div class="lin-card-body">${c.body}</div>` : ""}
          </div>`;
      })
      .join("");
    const summary =
      state.opened.size === s.cards.length ? `<div class="lin-summary">${s.summary}</div>` : "";
    return `
      <div class="lin-intro">${s.intro || ""}</div>
      ${img}${instruct}
      <div class="lin-cards">${cards}</div>
      ${summary}`;
  }

  function questionBody(s, state) {
    const opts = s.options
      .map((o) => {
        const wrong = state.wrong.has(o.key);
        const correct = state.answeredCorrect && o.key === s.correct;
        const disabled = wrong || state.answeredCorrect ? "disabled" : "";
        return `
          <button type="button" class="quiz-opt${wrong ? " wrong" : ""}${correct ? " correct" : ""}" data-key="${o.key}" ${disabled}>
            <span class="quiz-opt-key">${o.key}</span>
            <span class="quiz-opt-text">${o.text}</span>
          </button>`;
      })
      .join("");
    const feedback = state.answeredCorrect
      ? `<div class="quiz-feedback correct">${s.correctFeedback}</div>`
      : state.wrong.size
      ? `<div class="quiz-feedback try">${s.incorrectFeedback}</div>`
      : "";
    return `
      <div class="quiz-prompt">${s.prompt}</div>
      <div class="quiz-options">${opts}</div>
      ${feedback}`;
  }

  function revealBody(s, state) {
    let trigger;
    if (state.revealed) {
      trigger = `<div class="lin-reveal-body">${s.body}</div>`;
    } else if (s.imageSrc) {
      // A real photo as the clickable trigger.
      trigger = `<button type="button" class="lin-image-btn"><img class="lin-photo" src="${s.imageSrc}" alt="" /><span class="lin-image-cap">${s.prompt}</span></button>`;
    } else if (s.image) {
      // A named inline-SVG graphic (from IMAGES) as the clickable trigger.
      trigger = `<button type="button" class="lin-image-btn">${IMAGES[s.image] || ""}<span class="lin-image-cap">${s.prompt}</span></button>`;
    } else {
      trigger = `<button type="button" class="lin-reveal-btn">${s.prompt}</button>`;
    }
    return `
      <div class="lin-intro">${s.intro || ""}</div>
      ${trigger}`;
  }

  // ---- main render ------------------------------------------------------

  function render() {
    const s = screens[i];
    const state = st[i];

    let body = "";
    if (s.kind === "choice") body = choiceBody(s, state);
    else if (s.kind === "cards") body = cardsBody(s, state);
    else if (s.kind === "question") body = questionBody(s, state);
    else if (s.kind === "reveal") body = revealBody(s, state);

    const dots = screens
      .map((_, k) => `<span class="lin-dot${k === i ? " on" : ""}${met(k) ? " done" : ""}"></span>`)
      .join("");
    // Only show the step indicator for multi-screen flows.
    const steps =
      N > 1
        ? `<div class="lin-steps">${dots}<span class="lin-stepcount">Screen ${i + 1} of ${N}</span></div>`
        : "";

    const isLast = i === N - 1;
    const canContinue = met(i);
    const completed = isComplete(hotspot.id);
    const nextLabel = isLast ? (completed ? "Completed &#10003;" : "Finish") : "Continue";

    container.innerHTML = `
      ${steps}
      <div class="lin-heading">${icon(s.icon)}<span>${s.heading}</span></div>
      <div class="lin-screen">${body}</div>
      <div class="lin-footer">
        <button type="button" class="lin-back" ${i === 0 ? "disabled" : ""}>Back</button>
        <button type="button" class="lin-next" ${canContinue && !(isLast && completed) ? "" : "disabled"}>${nextLabel}</button>
      </div>`;

    wire(s, state);
  }

  function wire(s, state) {
    container.querySelector(".lin-back").addEventListener("click", () => {
      if (i > 0) {
        i--;
        render();
      }
    });
    container.querySelector(".lin-next").addEventListener("click", () => {
      if (!met(i)) return;
      if (i < N - 1) {
        i++;
        render();
      } else {
        if (!isComplete(hotspot.id)) onComplete();
        render();
      }
    });

    if (s.kind === "choice") {
      container.querySelectorAll(".lin-choice").forEach((b) => {
        b.addEventListener("click", () => {
          const text = s.options[Number(b.dataset.k)];
          if (state.selected !== text && !reviewMode) {
            sendResponded(activityId(s.activityId), s.prompt, text);
          }
          state.selected = text;
          render();
        });
      });
    } else if (s.kind === "cards") {
      container.querySelectorAll(".lin-card").forEach((b) => {
        const openCard = () => {
          const k = Number(b.dataset.k);
          if (!state.opened.has(k)) {
            state.opened.add(k);
            render();
          }
        };
        b.addEventListener("click", openCard);
        b.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openCard();
          }
        });
      });
    } else if (s.kind === "question") {
      container.querySelectorAll(".quiz-opt").forEach((b) => {
        b.addEventListener("click", () => {
          if (state.answeredCorrect || state.wrong.has(b.dataset.key)) return;
          const correct = b.dataset.key === s.correct;
          if (!reviewMode) sendAnswered(activityId(`question/${s.id}`), s.prompt, { success: correct, response: b.dataset.key });
          if (correct) state.answeredCorrect = true;
          else state.wrong.add(b.dataset.key);
          render();
        });
      });
    } else if (s.kind === "reveal") {
      const btn =
        container.querySelector(".lin-reveal-btn") ||
        container.querySelector(".lin-image-btn");
      if (btn) btn.addEventListener("click", () => {
        state.revealed = true;
        render();
      });
    }
  }

  render();
}
