// src/features/exams/components/exam-question-navigator.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns HTML string for the Question Navigator component in Exam Mode.
 * @param {object} options
 * @param {number} options.totalQuestions
 * @param {number} options.currentIndex
 * @param {object} options.answers
 * @returns {string}
 */
export function renderExamQuestionNavigator({
  totalQuestions = 0,
  currentIndex = 0,
  answers = {}
}) {
  if (!totalQuestions) return "";

  const pillsHtml = Array.from({ length: totalQuestions }, (_, idx) => {
    const isCurrent = idx === currentIndex;
    const rawAnswer = answers[idx];
    const isAnswered =
      rawAnswer !== undefined &&
      rawAnswer !== null &&
      String(rawAnswer).trim() !== "";

    let stateClass = "unanswered";
    let stateIcon = "○";
    let stateLabel = "غير مجاب";

    if (isAnswered) {
      stateClass = "answered";
      stateIcon = "●";
      stateLabel = "مجاب";
    }

    if (isCurrent) {
      stateClass += " current";
    }

    return `
      <button
        type="button"
        class="question-nav-pill ${stateClass}"
        data-nav-question-index="${idx}"
        aria-current="${isCurrent ? "true" : "false"}"
        aria-label="السؤال ${idx + 1}: ${stateLabel}"
      >
        <span class="pill-number">${idx + 1}</span>
        <span class="pill-dot" aria-hidden="true">${stateIcon}</span>
      </button>
    `;
  }).join("");

  return `
    <nav class="exam-question-navigator" aria-label="شريط التنقل بين الأسئلة">
      <div class="navigator-header">
        <span class="navigator-title">فهرس الأسئلة</span>
        <div class="navigator-legend">
          <span class="legend-item"><span class="legend-dot answered">●</span> مجاب</span>
          <span class="legend-item"><span class="legend-dot unanswered">○</span> غير مجاب</span>
        </div>
      </div>
      <div class="navigator-grid">
        ${pillsHtml}
      </div>
    </nav>
  `;
}
