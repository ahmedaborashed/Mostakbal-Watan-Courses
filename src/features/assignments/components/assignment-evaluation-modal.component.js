// src/features/assignments/components/assignment-evaluation-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { formatDateTime } from "../../../shared/utils/date.utils.js";

export const ASSIGNMENT_EVALUATION_MODAL_ID = "assignmentEvaluationModal";

/**
 * Returns HTML string for the Assignment Evaluation Modal shell.
 */
export function renderAssignmentEvaluationModal() {
  return renderModal({
    id: ASSIGNMENT_EVALUATION_MODAL_ID,
    title: `<span id="assignmentEvaluationModalTitle">تقييم تسليم الطالب</span>`,
    bodyHtml: `<div id="assignmentEvaluationModalBody"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-between w-full">
        <button type="button" class="btn btn-secondary" data-modal-close="${ASSIGNMENT_EVALUATION_MODAL_ID}">
          إلغاء
        </button>
        <button type="button" class="btn btn-primary font-bold" id="submitAssignmentGradeBtn">
          حفظ التقييم واعتماد الدرجة ✅
        </button>
      </div>
    `,
    maxWidth: "680px"
  });
}

/**
 * Returns inner HTML content for the assignment evaluation modal.
 * @param {object} options
 * @param {string} options.taskTitle
 * @param {object} options.submission
 * @returns {string}
 */
export function renderAssignmentEvaluationContent({ taskTitle, submission }) {
  const studentName = escapeHtml(submission.studentName || submission.name || "طالب");
  const studentPhone = escapeHtml(submission.studentPhone || submission.studentUid || "—");
  const submittedAtFormatted = formatDateTime(submission.submittedAt || submission.createdAt);
  const answerText = submission.answerText ? escapeHtml(submission.answerText) : "";
  const fileUrl = submission.fileUrl ? escapeHtml(submission.fileUrl) : "";
  const currentGrade = submission.grade != null ? submission.grade : "";
  const currentFeedback = submission.feedback ? escapeHtml(submission.feedback) : "";

  return `
    <div class="assignment-evaluation-view" dir="rtl">
      <!-- Student & Task Header Box -->
      <div class="card p-3 mb-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
        <div class="d-flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="text-xs text-muted d-block">الطالب:</span>
            <strong class="text-sm font-extrabold" style="color:var(--color-text-primary);">${studentName}</strong>
            <span class="text-xs text-muted font-mono ms-2">(${studentPhone})</span>
          </div>
          <div class="text-start">
            <span class="text-xs text-muted d-block">الواجب:</span>
            <strong class="text-xs font-bold text-primary">${escapeHtml(taskTitle || "الواجب")}</strong>
            <span class="text-xs text-muted d-block mt-1">تاريخ التسليم: ${submittedAtFormatted}</span>
          </div>
        </div>
      </div>

      <!-- Submitted Content Preview -->
      <div class="mb-3">
        <label class="form-label font-bold text-xs text-muted mb-1 d-block">محتوى إجابة الطالب:</label>
        ${
          answerText
            ? `
          <div
            class="p-3 mb-2"
            style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);border-radius:var(--radius-sm);min-height:70px;white-space:pre-wrap;line-height:1.6;font-size:0.95rem;color:var(--color-text-primary);border-inline-start:4px solid var(--color-accent);"
          >${answerText}</div>
        `
            : `<div class="p-2 mb-2 text-xs text-muted" style="background:var(--color-bg-secondary);border-radius:var(--radius-sm);">لا توجد إجابة نصية مدونة.</div>`
        }

        ${
          fileUrl
            ? `
          <div class="d-flex items-center justify-between p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
            <div class="d-flex items-center gap-2">
              <span style="font-size:1.3rem;">📄</span>
              <div>
                <strong class="text-xs font-bold d-block" style="color:var(--color-text-primary);">الملف المرفق من الطالب</strong>
                <span class="text-xs text-muted">ملف حل الواجب المقدم</span>
              </div>
            </div>
            <a
              href="${fileUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline btn-sm font-bold"
            >
              فتح ومعاينة الملف ↗
            </a>
          </div>
        `
            : ""
        }
      </div>

      <!-- Grading and Feedback Controls -->
      <div class="card p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);border-radius:var(--radius-sm);">
        <div class="form-group mb-3">
          <label for="evalGradeInput" class="form-label font-extrabold text-sm mb-1" style="color:var(--color-text-primary);">
            الدرجة المستحقة (من 100): <span class="text-danger">*</span>
          </label>
          <div class="d-flex items-center gap-3">
            <input
              type="number"
              id="evalGradeInput"
              class="form-control font-black text-center"
              style="max-width:140px;font-size:1.25rem;"
              min="0"
              max="100"
              step="1"
              value="${currentGrade}"
              placeholder="0-100"
              required
            />
            <span class="text-xs text-muted">
              أدخل درجة بين 0 و 100. ستظهر فوراً للطالب في ملفه الدراسي وتُحدّث إحصاءات الواجب.
            </span>
          </div>
        </div>

        <div class="form-group mb-0">
          <label for="evalFeedbackInput" class="form-label font-bold text-xs text-muted mb-1">
            ملاحظات وتوجيهات المعلم (اختياري):
          </label>
          <textarea
            id="evalFeedbackInput"
            class="form-control"
            rows="3"
            placeholder="اكتب توجيهاتك أو ملاحظاتك التشجيعية للطالب حول حله..."
          >${currentFeedback}</textarea>
        </div>
      </div>
    </div>
  `;
}
