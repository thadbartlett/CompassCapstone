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
};

function icon(name) {
  const g = ICONS[name];
  if (!g) return "";
  return `<svg class="lin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
}

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
    const cards = s.cards
      .map((c, k) => {
        const open = state.opened.has(k);
        return `
          <button type="button" class="lin-card${open ? " open" : ""}" data-k="${k}">
            <span class="lin-card-head">${icon(c.icon)}<span class="lin-card-title">${c.title}</span>
              <span class="lin-card-chev">${open ? "&#9660;" : "&#9654;"}</span></span>
            ${open ? `<span class="lin-card-body">${c.body}</span>` : ""}
          </button>`;
      })
      .join("");
    const summary =
      state.opened.size === s.cards.length ? `<div class="lin-summary">${s.summary}</div>` : "";
    return `
      <div class="lin-intro">${s.intro || ""}</div>
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
    const panel = state.revealed
      ? `<div class="lin-reveal-body">${s.body}</div>`
      : `<button type="button" class="lin-reveal-btn">${s.prompt}</button>`;
    return `
      <div class="lin-intro">${s.intro || ""}</div>
      ${panel}`;
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

    const isLast = i === N - 1;
    const canContinue = met(i);
    const completed = isComplete(hotspot.id);
    const nextLabel = isLast ? (completed ? "Completed &#10003;" : "Finish") : "Continue";

    container.innerHTML = `
      <div class="lin-steps">${dots}<span class="lin-stepcount">Screen ${i + 1} of ${N}</span></div>
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
        b.addEventListener("click", () => {
          state.opened.add(Number(b.dataset.k));
          render();
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
      const btn = container.querySelector(".lin-reveal-btn");
      if (btn) btn.addEventListener("click", () => {
        state.revealed = true;
        render();
      });
    }
  }

  render();
}
