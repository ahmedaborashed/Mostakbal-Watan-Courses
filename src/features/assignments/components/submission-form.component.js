// src/features/assignments/components/submission-form.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderTextarea } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

export function renderSubmissionModal() {
  const bodyHtml = `
    <form id="taskSubmissionForm" onsubmit="return false;">
      <input type="hidden" id="submitAssignmentId" value="" />
      <h4 id="submitAssignmentTitle" class="font-bold text-accent mb-3"></h4>

      ${renderTextarea({
        id: "taskAnswerText",
        label: "إجابة التاسك / ملاحظاتك",
        placeholder: "اكتب الكود، الرابط، أو شرح الحل هنا...",
        rows: 4
      })}

      <div class="form-group">
        <label class="form-label" for="taskSubmissionFile">ملف الحل (PDF / ZIP / صورة / ملف نصي)</label>
        <input type="file" id="taskSubmissionFile" class="form-input" accept=".pdf,.zip,.rar,.png,.jpg,.jpeg,.py,.txt,.docx,.doc" />
        <span class="text-xs text-muted mt-1 d-block">الحد الأقصى للملف: 20 ميجابايت</span>
      </div>

      <div class="mt-4">
        ${renderButton({
          id: "submitTaskAnswerBtn",
          text: "إرسال الحل الآن 🚀",
          type: "submit",
          variant: "primary",
          className: "w-full"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "taskSubmissionModal",
    title: "📤 تسليم إجابة التاسك",
    bodyHtml
  });
}
