// quiz.js
//
// Renders a multiple-choice quiz popup (used by the Rules hotspot). Flow:
//   intro -> one question at a time. A wrong answer marks that option and shows
//   "try again" (keep going until correct); a correct answer reveals the
//   feedback content and a Next/Finish button. After the last question, the
//   hotspot is marked complete via onComplete.
//
// xAPI: every answer attempt sends an "answered" statement with result.success
// (correct/incorrect) and result.response (the chosen option key). When the quiz
// is opened again after completion, it runs in read-only "review" mode and does
// NOT re-send answer statements.

import { QUIZZES } from "./quiz.config.js";
import { ACTIVITY_BASE } from "./hotspots.config.js";
import { isComplete } from "./state.js";
import { sendAnswered } from "./xapi.js";

export function renderQuiz(container, hotspot, { onComplete }) {
  const quiz = QUIZZES[hotspot.id];
  if (!quiz) {
    container.innerHTML = "<p>(No quiz is configured for this section.)</p>";
    return;
  }

  const questions = quiz.questions;
  const N = questions.length;
  // If it was already complete when opened, we're reviewing — don't re-track.
  const reviewMode = isComplete(hotspot.id);

  let qIndex = -1; // -1 = intro; 0..N-1 = questions
  let answeredCorrect = false;
  const wrongPicks = new Set();

  function questionActivityId(q) {
    return `${ACTIVITY_BASE}/${hotspot.id}/question/${q.id}`;
  }

  function renderIntro() {
    const banner = reviewMode
      ? `<div class="quiz-done">&#10003; You've completed this section. You're welcome to review it.</div>`
      : "";
    container.innerHTML = `
      ${banner}
      <div class="quiz-intro">${quiz.intro}</div>
      <div class="quiz-actions">
        <button type="button" class="quiz-btn" data-act="begin">${
          reviewMode ? "Review" : "Begin"
        }</button>
      </div>`;
    container.querySelector('[data-act="begin"]').addEventListener("click", () => {
      qIndex = 0;
      startQuestion();
    });
  }

  function startQuestion() {
    answeredCorrect = false;
    wrongPicks.clear();
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[qIndex];
    const opts = q.options
      .map((o) => {
        const wrong = wrongPicks.has(o.key);
        const correct = answeredCorrect && o.key === q.correct;
        const disabled = wrong || answeredCorrect ? "disabled" : "";
        return `
          <button type="button" class="quiz-opt${wrong ? " wrong" : ""}${
          correct ? " correct" : ""
        }" data-key="${o.key}" ${disabled}>
            <span class="quiz-opt-key">${o.key}</span>
            <span class="quiz-opt-text">${o.text}</span>
          </button>`;
      })
      .join("");

    const feedback = answeredCorrect
      ? `<div class="quiz-feedback correct">${q.feedback}</div>`
      : wrongPicks.size
      ? `<div class="quiz-feedback try">Not quite — try again.</div>`
      : "";

    const nextLabel = qIndex === N - 1 ? "Finish" : "Next";
    const actions = answeredCorrect
      ? `<button type="button" class="quiz-btn" data-act="next">${nextLabel}</button>`
      : "";

    container.innerHTML = `
      <div class="quiz-progress">Question ${qIndex + 1} of ${N}</div>
      <div class="quiz-prompt">${q.prompt}</div>
      <div class="quiz-options">${opts}</div>
      ${feedback}
      <div class="quiz-actions">${actions}</div>`;

    container.querySelectorAll(".quiz-opt").forEach((b) => {
      b.addEventListener("click", () => choose(q, b.dataset.key));
    });
    const nextBtn = container.querySelector('[data-act="next"]');
    if (nextBtn) nextBtn.addEventListener("click", advance);
  }

  function choose(q, key) {
    if (answeredCorrect || wrongPicks.has(key)) return;
    const correct = key === q.correct;
    if (!reviewMode) {
      sendAnswered(questionActivityId(q), q.prompt, { success: correct, response: key });
    }
    if (correct) answeredCorrect = true;
    else wrongPicks.add(key);
    renderQuestion();
  }

  function advance() {
    if (qIndex < N - 1) {
      qIndex++;
      startQuestion();
    } else {
      finish();
    }
  }

  function finish() {
    if (!isComplete(hotspot.id)) onComplete(); // marks complete + fires statement
    container.innerHTML = `
      <div class="quiz-done">&#10003; You've completed the Rules for Capstone Students.</div>
      <p>Thanks for working through these. Remember, more detail lives in the
      <strong>Compass Handbook</strong>.</p>`;
  }

  renderIntro();
}
