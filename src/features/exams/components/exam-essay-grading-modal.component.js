// src/features/exams/components/exam-essay-grading-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";

export const ESSAY_GRADING_MODAL_ID = "examEssayGradingModal";

/**
 * Returns HTML string for the essay grading modal shell.
 */
export function renderExamEssayGradingModal() {
  return renderModal({
    id: ESSAY_GRADING_MODAL_ID,
    title: "تصحيح السؤال المقالي",
    bodyHtml: `<div id="essayGradingModalBodySlot" class="p-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-between w-full">
        <button type="button" class="btn btn-secondary" data-modal-close="${ESSAY_GRADING_MODAL_ID}">
          إلغاء
        </button>
        <button type="button" class="btn btn-primary font-bold" id="submitEssayGradeBtn">
          اعتماد الدرجة وحفظ النتيجة ✅
        </button>
      </div>
    `,
    maxWidth: "680px"
  });
}

/**
 * Returns inner HTML content for the essay grading modal.
 * @param {object} options
 * @param {object} options.exam
 * @param {object} options.result
 * @param {number} options.questionIndex
 * @param {object} options.question
 * @param {string} options.studentAnswer
 * @param {number|null} options.currentScore
 * @returns {string}
 */
export function renderEssayGradingContent({
  exam,
  result,
  questionIndex,
  question,
  studentAnswer,
  currentScore
}) {
  const maxDegree = Number(question?.degree) || 1;
  const safeStudentName = escapeHtml(result.studentName || "طالب غير محدد");
  const safePhone = escapeHtml(result.studentPhone || result.studentUid || "—");
  const safeExamTitle = escapeHtml(exam.title || "الامتحان");
  const safeQuestion = escapeHtml(question.question || `سؤال مقالي #${questionIndex + 1}`);
  const safeAnswer = escapeHtml(studentAnswer || "(لم يقدم الطالب إجابة مكتوبة)");

  return `
    <div class="essay-grading-view">
      <!-- Student & Exam Header Info -->
      <div class="card p-3 mb-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
        <div class="d-flex items-center justify-between flex-wrap gap-2">
          <div>
            <span class="text-xs text-muted d-block">الطالب:</span>
            <strong class="text-sm font-extrabold" style="color:var(--color-text-primary);">${safeStudentName}</strong>
            <span class="text-xs text-muted font-mono ms-2">(${safePhone})</span>
          </div>
          <div class="text-start">
            <span class="text-xs text-muted d-block">الامتحان:</span>
            <strong class="text-xs font-bold text-primary">${safeExamTitle}</strong>
          </div>
        </div>
      </div>

      <!-- Question Box -->
      <div class="mb-3">
        <div class="d-flex items-center justify-between mb-1">
          <span class="badge badge-gold font-bold text-xs">السؤال رقم ${questionIndex + 1} (سؤال مقالي)</span>
          <span class="text-xs text-muted">الدرجة القصوى: <strong class="text-accent font-bold">${maxDegree}</strong> درجات</span>
        </div>
        <div class="p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
          <p class="font-bold text-sm m-0" style="color:var(--color-text-primary);line-height:1.5;">${safeQuestion}</p>
        </div>
      </div>

      <!-- Student's Written Answer Box -->
      <div class="mb-4">
        <label class="form-label font-bold text-xs text-muted mb-1 d-block">إجابة الطالب المدونة:</label>
        <div
          class="p-3"
          style="background:var(--color-bg-primary);border:1px solid var(--color-border-primary);border-radius:var(--radius-sm);min-height:90px;white-space:pre-wrap;line-height:1.6;font-size:0.95rem;color:var(--color-text-primary);border-inline-start:4px solid var(--color-accent);"
        >${safeAnswer}</div>
      </div>

      <!-- Grading Input Section -->
      <div class="card p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);border-radius:var(--radius-sm);">
        <div class="form-group mb-0">
          <label for="essayGradeInput" class="form-label font-extrabold text-sm mb-1" style="color:var(--color-text-primary);">
            الدرجة المستحقة (من ${maxDegree}): <span class="text-danger">*</span>
          </label>
          <div class="d-flex items-center gap-3">
            <input
              type="number"
              id="essayGradeInput"
              class="form-control font-black text-center"
              style="max-width:140px;font-size:1.25rem;"
              min="0"
              max="${maxDegree}"
              step="0.5"
              value="${currentScore != null ? currentScore : ""}"
              placeholder="0"
              required
            />
            <span class="text-xs text-muted">
              أدخل درجة بين 0 و ${maxDegree}. سيتم إعادة احتساب المجموع وتحديث حالة النتيجة فوراً على السيرفر.
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}
