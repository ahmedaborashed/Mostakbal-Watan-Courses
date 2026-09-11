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
  answers = {},
  isCollapsedOnMobile = false
}) {
  if (!totalQuestions) return "";

  let answeredCount = 0;

  const pillsHtml = Array.from({ length: totalQuestions }, (_, idx) => {
    const isCurrent = idx === currentIndex;
    const rawAnswer = answers[idx];
    const isAnswered =
      rawAnswer !== undefined &&
      rawAnswer !== null &&
      String(rawAnswer).trim() !== "";

    if (isAnswered) answeredCount++;

    let stateClass = "unanswered";
    let stateIcon = "○";
    let stateLabel = "غير مجاب";

    if (isAnswered) {
      stateClass = "answered";
      stateIcon = "✓";
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
        title="السؤال ${idx + 1} (${stateLabel})"
      >
        <span class="pill-number">${idx + 1}</span>
        <span class="pill-dot" aria-hidden="true">${stateIcon}</span>
      </button>
    `;
  }).join("");

  return `
    <nav class="exam-question-navigator ${isCollapsedOnMobile ? "is-collapsed-mobile" : ""}" aria-label="شريط التنقل بين الأسئلة">
      <div class="navigator-header">
        <div class="d-flex items-center gap-2">
          <span class="navigator-title">فهرس الأسئلة</span>
          <span class="badge badge-neutral text-xs font-bold" id="navigatorAnsweredCounter">
            ${answeredCount} / ${totalQuestions}
          </span>
        </div>

        <div class="d-flex items-center gap-3">
          <div class="navigator-legend">
            <span class="legend-item"><span class="legend-dot answered" aria-hidden="true">✓</span> مجاب</span>
            <span class="legend-item"><span class="legend-dot unanswered" aria-hidden="true">○</span> غير مجاب</span>
          </div>

          <button
            type="button"
            class="navigator-mobile-toggle d-md-none btn btn-secondary btn-sm"
            id="btnToggleQuestionNav"
            aria-expanded="${isCollapsedOnMobile ? "false" : "true"}"
            aria-controls="examNavigatorGrid"
            aria-label="إظهار أو طي فهرس الأسئلة"
          >
            <span>${isCollapsedOnMobile ? "عرض الفهرس ▾" : "إخفاء الفهرس ▴"}</span>
          </button>
        </div>
      </div>
      <div class="navigator-grid" id="examNavigatorGrid">
        ${pillsHtml}
      </div>
    </nav>
  `;
}
