// src/features/exams/components/student-exam-review.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"];

/**
 * Returns HTML string for the Student Exam Review screen before final submission.
 * @param {object} options
 * @param {string} options.examTitle
 * @param {Array} options.questions
 * @param {object} options.answers
 * @param {number} [options.currentIndex=0]
 * @param {string} [options.timerHtml=""]
 * @returns {string}
 */
export function renderStudentExamReviewMode({
  examTitle = "الامتحان",
  questions = [],
  answers = {},
  currentIndex = 0,
  timerHtml = ""
}) {
  const totalQuestions = questions.length;
  const answeredIndices = [];
  const unansweredIndices = [];

  questions.forEach((_, idx) => {
    const rawVal = answers[idx];
    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
      answeredIndices.push(idx);
    } else {
      unansweredIndices.push(idx);
    }
  });

  const answeredCount = answeredIndices.length;
  const unansweredCount = unansweredIndices.length;
  const isComplete = unansweredCount === 0;

  // Build question review cards
  const questionsListHtml = questions
    .map((q, idx) => {
      const qNum = idx + 1;
      const isEssay = q.type === "essay";
      const rawAns = answers[idx];
      const hasAnswer = rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== "";
      const degree = Number(q.degree || 1);

      let answerPreviewText = "";
      if (hasAnswer) {
        if (isEssay) {
          const str = String(rawAns);
          answerPreviewText = str.length > 80 ? str.slice(0, 80) + "..." : str;
        } else {
          const optIdx = Number(rawAns);
          const letter = OPTION_LETTERS[optIdx] || `#${optIdx + 1}`;
          const optText = Array.isArray(q.options) && q.options[optIdx] ? q.options[optIdx] : "";
          answerPreviewText = `الخيار (${letter}): ${optText}`;
        }
      }

      return `
        <div class="card p-3 review-question-item ${hasAnswer ? "is-answered" : "is-unanswered"}" data-review-item-idx="${idx}">
          <div class="d-flex items-center justify-between gap-2 flex-wrap mb-2">
            <div class="d-flex items-center gap-2">
              <span class="review-q-num font-black">السؤال ${qNum}</span>
              ${
                hasAnswer
                  ? renderBadge({ text: "تمت الإجابة ✓", variant: "success", className: "text-xs" })
                  : renderBadge({ text: "غير مجاب ○", variant: "warning", className: "text-xs" })
              }
              <span class="text-xs text-muted">(${degree} ${degree === 1 ? "درجة" : "درجات"})</span>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-sm btn-jump-question"
              data-jump-to-question="${idx}"
              aria-label="الانتقال وتعديل السؤال ${qNum}"
            >
              <span>${hasAnswer ? "تعديل الإجابة ✎" : "إجابة السؤال ↵"}</span>
            </button>
          </div>

          <p class="review-question-text text-sm font-semibold mb-2 m-0" style="color: var(--text-primary);">
            ${escapeHtml(q.question || q.title || "نص السؤال")}
          </p>

          <div class="review-answer-snippet text-xs">
            ${
              hasAnswer
                ? `<span class="text-success font-medium d-flex items-center gap-1">
                     <span aria-hidden="true">✓</span>
                     <span>${escapeHtml(answerPreviewText)}</span>
                   </span>`
                : `<span class="text-warning font-medium d-flex items-center gap-1">
                     <span aria-hidden="true">○</span>
                     <span>لم يتم تسجيل إجابة بعد.</span>
                   </span>`
            }
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="student-exam-review-shell">
      <!-- Review Header -->
      <header class="exam-review-header card p-4 mb-4">
        <div class="d-flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <span class="badge badge-primary font-bold mb-1">مراجعة الإجابات قبل التسليم</span>
            <h2 class="font-black m-0" style="font-size: 1.35rem; color: var(--text-primary);">
              ${escapeHtml(examTitle)}
            </h2>
          </div>
          <div class="review-timer-wrap">
            ${timerHtml}
          </div>
        </div>

        <!-- Summary Grid (Total / Answered / Unanswered) -->
        <div class="exam-review-summary-grid">
          <div class="summary-card total">
            <span class="summary-label">إجمالي الأسئلة</span>
            <strong class="summary-value">${totalQuestions}</strong>
          </div>
          <div class="summary-card answered">
            <span class="summary-label">تمت الإجابة</span>
            <strong class="summary-value text-success">${answeredCount}</strong>
          </div>
          <div class="summary-card unanswered">
            <span class="summary-label">غير مجاب</span>
            <strong class="summary-value ${isComplete ? "text-success" : "text-warning"}">${unansweredCount}</strong>
          </div>
        </div>

        ${
          !isComplete
            ? `
          <div class="alert alert-warning text-xs mt-3 mb-0" style="line-height: 1.6;">
            <strong>تنبيه مراجعة:</strong> لديك <strong>${unansweredCount}</strong> أسئلة بدون إجابة. يمكنك الضغط على أي سؤال لإجابته قبل تسليم الامتحان نهائياً.
          </div>
        `
            : `
          <div class="alert alert-success text-xs mt-3 mb-0" style="line-height: 1.6;">
            <strong>ممتاز!</strong> تمت الإجابة عن جميع الأسئلة (${answeredCount} من ${totalQuestions}). راجع إجاباتك جيداً ثم اضغط "تسليم الامتحان".
          </div>
        `
        }
      </header>

      <!-- Questions List -->
      <div class="exam-review-questions-list d-flex flex-col gap-3 mb-5">
        ${questionsListHtml}
      </div>

      <!-- Action Footer -->
      <footer class="exam-review-footer card p-4 d-flex items-center justify-between flex-wrap gap-3 sticky-review-footer">
        ${renderButton({
          id: "btnReturnToQuestionMode",
          text: "العودة إلى الأسئلة ↵",
          variant: "secondary",
          className: "btn-md"
        })}

        <div class="d-flex items-center gap-2">
          ${renderButton({
            id: "btnReviewSubmitExam",
            text: "تسليم الامتحان 🚀",
            variant: "primary",
            className: "btn-md"
          })}
        </div>
      </footer>
    </div>
  `;
}
