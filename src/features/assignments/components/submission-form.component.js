// src/features/assignments/components/submission-form.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderTextarea } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderFileUploadZone } from "../../../shared/components/FileUpload/file-upload.component.js";

export function renderSubmissionModal() {
  const bodyHtml = `
    <form id="taskSubmissionForm" onsubmit="return false;">
      <input type="hidden" id="submitAssignmentId" value="" />
      <div class="mb-4">
        <span class="badge badge-gold mb-1">تسليم الواجب</span>
        <h4 id="submitAssignmentTitle" class="font-extrabold text-accent" style="font-size:1.2rem;margin:0;"></h4>
      </div>

      ${renderTextarea({
        id: "taskAnswerText",
        label: "شرح الحل / الكود البرمجي / الروابط",
        placeholder: "اكتب كود الـ Python، رابط الـ GitHub، أو ملاحظات الحل هنا...",
        rows: 4
      })}

      ${renderFileUploadZone({
        id: "taskUploadZone",
        inputId: "taskSubmissionFile",
        label: "اسحب وأفلت ملف الحل هنا (PDF, ZIP, Code, Images)",
        sublabel: "أو اضغط لتصفح واختيار الملف من جهازك",
        accept: ".pdf,.zip,.rar,.png,.jpg,.jpeg,.py,.txt,.docx,.doc",
        hint: "الحد الأقصى لحجم الملف المرفوع: 20 ميجابايت"
      })}

      <div class="mt-6">
        ${renderButton({
          id: "submitTaskAnswerBtn",
          text: "إرسال الحل والتسليم النهائي 🚀",
          type: "submit",
          variant: "primary",
          className: "w-full btn-lg"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "taskSubmissionModal",
    title: "📤 تسليم إجابة التاسك العملي",
    bodyHtml,
    maxWidth: "600px"
  });
}
