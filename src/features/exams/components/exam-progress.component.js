// src/features/exams/components/exam-progress.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns HTML string for the Exam Progress Bar component.
 * @param {object} options
 * @param {number} options.answeredCount
 * @param {number} options.totalQuestions
 * @returns {string}
 */
export function renderExamProgress({ answeredCount = 0, totalQuestions = 0 }) {
  const percentage =
    totalQuestions > 0 ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0;

  return `
    <div class="exam-progress-container" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="نسبة تقدم إجابة الأسئلة">
      <div class="exam-progress-header">
        <span class="exam-progress-label">
          تمت الإجابة عن: <strong>${answeredCount}</strong> من <strong>${totalQuestions}</strong> سؤال
        </span>
        <span class="exam-progress-percentage font-bold">${percentage}%</span>
      </div>
      <div class="exam-progress-track">
        <div class="exam-progress-fill" style="width: ${percentage}%;"></div>
      </div>
    </div>
  `;
}
