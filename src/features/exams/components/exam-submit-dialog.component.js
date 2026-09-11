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
    <div class="text-center py-4">
      <div class="modal-icon-header ${isAllAnswered ? "icon-success" : "icon-warning"}" style="font-size: 3rem; margin-bottom: 1rem;" aria-hidden="true">
        ${isAllAnswered ? "🎉" : "⚠️"}
      </div>

      <h3 class="font-extrabold mb-2" style="font-size: 1.3rem; color: var(--text-primary);">
        هل أنت متأكد من تسليم إجاباتك؟
      </h3>

      <div class="exam-submit-summary-box mb-4">
        <div class="summary-item answered">
          <span class="summary-label">تمت الإجابة عن:</span>
          <strong class="summary-val">${answeredCount} / ${totalQuestions}</strong>
        </div>
        <div class="summary-item ${isAllAnswered ? "completed" : "unanswered"}">
          <span class="summary-label">الأسئلة المتبقية:</span>
          <strong class="summary-val">${unansweredCount}</strong>
        </div>
      </div>

      ${
        !isAllAnswered
          ? `
        <div class="alert alert-warning mb-4 text-start text-xs" style="line-height: 1.6;">
          <strong>تنبيه:</strong> لديك <strong>${unansweredCount}</strong> أسئلة دون إجابة. سيتم احتساب درجات ما قمت بحله فقط.
        </div>
      `
          : `
        <p class="text-muted text-sm mb-4">
          أحسنت! قمت بالإجابة عن جميع الأسئلة.
        </p>
      `
      }

      <p class="text-muted text-xs mb-0">
        بمجرد الضغط على تأكيد التسليم، سيتم قفل الامتحان وإرسال إجاباتك للتصحيح المعتمد ولن تتمكن من التعديل.
      </p>
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-3 w-full justify-between">
      ${renderButton({
        id: "cancelSubmitExamBtn",
        text: "متابعة الإجابة ↵",
        variant: "secondary",
        className: "flex-1"
      })}
      ${renderButton({
        id: "confirmFinalSubmitExamBtn",
        text: "تأكيد وتسليم الامتحان 🚀",
        variant: "primary",
        className: "flex-1"
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
