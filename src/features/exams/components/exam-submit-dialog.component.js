// src/features/exams/components/exam-submit-dialog.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

export const EXAM_SUBMIT_MODAL_ID = "examSubmitConfirmModal";

/**
 * Returns HTML string for the Submit Confirmation Modal.
 * @param {object} options
 * @param {number} options.answeredCount
 * @param {number} options.totalQuestions
 * @returns {string}
 */
export function renderExamSubmitDialog({ answeredCount = 0, totalQuestions = 0 }) {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const isAllAnswered = unansweredCount === 0;

  const bodyHtml = `
    <div class="text-center py-3">
      <div class="modal-icon-header ${isAllAnswered ? "icon-success" : "icon-warning"}" style="font-size: 2.75rem; margin-bottom: 0.75rem;" aria-hidden="true">
        ${isAllAnswered ? "📝" : "⚠️"}
      </div>

      <h3 class="font-black mb-3" style="font-size: 1.3rem; color: var(--text-primary);">
        هل أنت متأكد من تسليم الامتحان؟
      </h3>

      <div class="exam-submit-summary-box mb-4">
        <div class="summary-item total">
          <span class="summary-label">إجمالي الأسئلة:</span>
          <strong class="summary-val">${totalQuestions} سؤال</strong>
        </div>
        <div class="summary-item answered">
          <span class="summary-label">تمت الإجابة عن:</span>
          <strong class="summary-val">${answeredCount} / ${totalQuestions}</strong>
        </div>
        <div class="summary-item ${isAllAnswered ? "completed" : "unanswered"}">
          <span class="summary-label">غير مجاب:</span>
          <strong class="summary-val">${unansweredCount}</strong>
        </div>
      </div>

      ${
        !isAllAnswered
          ? `
        <div class="alert alert-warning mb-4 text-start text-xs" style="line-height: 1.6;">
          <strong>تنبيه:</strong> لديك <strong>${unansweredCount}</strong> أسئلة دون إجابة. سيتم احتساب درجات ما قمت بإجابته فقط.
        </div>
      `
          : `
        <div class="alert alert-success mb-4 text-start text-xs" style="line-height: 1.6;">
          <strong>أحسنت!</strong> تمت الإجابة عن جميع أسئلة الامتحان.
        </div>
      `
      }

      <p class="text-muted text-xs mb-1 font-semibold" style="line-height: 1.6;">
        بعد التسليم لن تتمكن من تعديل الإجابات وفقًا لسياسة الامتحان.
      </p>
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-3 w-full justify-between">
      ${renderButton({
        id: "cancelSubmitExamBtn",
        text: "الرجوع",
        variant: "secondary",
        className: "flex-1 btn-md"
      })}
      ${renderButton({
        id: "confirmFinalSubmitExamBtn",
        text: "تأكيد التسليم 🚀",
        variant: "primary",
        className: "flex-1 btn-md"
      })}
    </div>
  `;

  return renderModal({
    id: EXAM_SUBMIT_MODAL_ID,
    title: "تأكيد تسليم الامتحان",
    bodyHtml,
    footerHtml,
    size: "md"
  });
}
