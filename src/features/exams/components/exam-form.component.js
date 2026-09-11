// src/features/exams/components/exam-form.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { GROUPS } from "../../../core/constants.js";
import { renderQuestionsContainer } from "./exam-question-editor.component.js";
import { renderExamReview } from "./exam-review.component.js";

export const EXAM_FORM_MODAL_ID = "adminExamFormModal";

/**
 * Returns HTML string for the Stepper Progress Indicator Header.
 * @param {number} currentStep (1, 2, or 3)
 * @returns {string}
 */
export function renderExamFormStepper(currentStep = 1) {
  const steps = [
    { num: 1, label: "بيانات الامتحان" },
    { num: 2, label: "إدارة الأسئلة" },
    { num: 3, label: "المراجعة والنشر" }
  ];

  return `
    <div class="exam-form-stepper mb-4" role="tablist" aria-label="مراحل إعداد الامتحان">
      <div class="d-flex items-center justify-between position-relative px-2">
        ${steps
          .map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const stepClass = isCompleted ? "step-completed" : isCurrent ? "step-active" : "step-pending";
            return `
            <div class="step-item d-flex items-center gap-2 ${stepClass}" data-step-nav="${step.num}">
              <span class="step-circle font-black">${isCompleted ? "✓" : step.num}</span>
              <span class="step-label text-xs font-bold">${step.label}</span>
            </div>
            ${
              idx < steps.length - 1
                ? `<div class="step-connector flex-1 mx-2 ${currentStep > step.num ? "connector-completed" : ""}"></div>`
                : ""
            }
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for Step 1: Exam Basic Information.
 * @param {object} exam
 * @returns {string}
 */
export function renderExamInfoStep(exam = {}) {
  const title = exam.title || "";
  const description = exam.description || "";
  const selectedGroup = exam.group || "ALL";
  const duration = Number(exam.duration) || 30;
  const passDegree = exam.passDegree !== undefined ? exam.passDegree : 50;
  const isActive = exam.active !== false;

  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatForInput = (d) => {
    if (!d) return "";
    try {
      const date = typeof d?.toDate === "function" ? d.toDate() : new Date(d);
      if (isNaN(date.getTime())) return "";
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return "";
    }
  };

  const startVal = formatForInput(exam.startDate);
  const deadlineVal = formatForInput(exam.deadline);

  const groupOptions = [
    `<option value="ALL" ${selectedGroup === "ALL" ? "selected" : ""}>جميع المجموعات (عام لجميع الطلاب)</option>`,
    ...GROUPS.map((g) => `<option value="${escapeHtml(g)}" ${selectedGroup === g ? "selected" : ""}>${escapeHtml(g)}</option>`)
  ].join("");

  return `
    <div id="step1Container" class="exam-step-content">
      <!-- Title -->
      <div class="form-group mb-3">
        <label class="form-label font-bold text-xs" for="examFormTitle">
          اسم / عنوان الامتحان <span class="text-danger">*</span>
        </label>
        <input
          type="text"
          id="examFormTitle"
          class="form-input"
          placeholder="مثال: الاختبار النصفي - أساسيات الدوال وهياكل البيانات"
          value="${escapeHtml(title)}"
          required
          autofocus
        />
        <span id="examFormTitleError" class="form-error d-none">يرجى كتابة عنوان واضح للامتحان (على الأقل 3 أحرف).</span>
      </div>

      <!-- Description -->
      <div class="form-group mb-3">
        <label class="form-label font-bold text-xs" for="examFormDesc">
          وصف أو تعليمات الاختبار للطلاب (اختياري)
        </label>
        <textarea
          id="examFormDesc"
          class="form-textarea"
          rows="2"
          placeholder="اكتب تعليمات وشروط الاختبار للطلاب..."
        >${escapeHtml(description)}</textarea>
      </div>

      <!-- Group & Duration -->
      <div class="grid-2 gap-3 mb-3">
        <div class="form-group">
          <label class="form-label font-bold text-xs" for="examFormGroup">
            المجموعة المستهدفة <span class="text-danger">*</span>
          </label>
          <select id="examFormGroup" class="form-select" required>
            ${groupOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label font-bold text-xs" for="examFormDuration">
            مدة الامتحان (بالدقائق) <span class="text-danger">*</span>
          </label>
          <div class="d-flex items-center gap-2">
            <input
              type="number"
              id="examFormDuration"
              class="form-input"
              value="${duration}"
              min="5"
              max="240"
              required
            />
            <span class="text-xs text-muted font-bold" style="white-space: nowrap;">دقيقة</span>
          </div>
          <span id="examFormDurationError" class="form-error d-none">يرجى إدخال مدة صحيحة للامتحان (5 دقائق فأكثر).</span>
        </div>
      </div>

      <!-- Dates: Start & Deadline -->
      <div class="grid-2 gap-3 mb-3">
        <div class="form-group">
          <label class="form-label font-bold text-xs" for="examFormStartDate">
            تاريخ ووقت فتح الامتحان (اختياري)
          </label>
          <input
            type="datetime-local"
            id="examFormStartDate"
            class="form-input"
            value="${startVal}"
          />
          <span class="form-hint text-xs text-muted">سيظهر الامتحان كـ "قريباً" حتى يحين هذا الموعد.</span>
        </div>

        <div class="form-group">
          <label class="form-label font-bold text-xs" for="examFormDeadline">
            الموعد النهائي / غلق الامتحان (اختياري)
          </label>
          <input
            type="datetime-local"
            id="examFormDeadline"
            class="form-input"
            value="${deadlineVal}"
          />
          <span id="examFormDeadlineError" class="form-error d-none">الموعد النهائي يجب أن يكون بعد تاريخ البداية.</span>
        </div>
      </div>

      <!-- Pass degree & Active checkbox -->
      <div class="grid-2 gap-3 mb-2 items-center">
        <div class="form-group">
          <label class="form-label font-bold text-xs" for="examFormPassDegree">
            درجة النجاح المقترحة (اختياري)
          </label>
          <input
            type="number"
            id="examFormPassDegree"
            class="form-input"
            value="${passDegree}"
            min="0"
            max="1000"
            placeholder="50"
          />
        </div>

        <div class="form-group pt-4">
          <label class="d-flex items-center gap-2 cursor-pointer" style="margin: 0;">
            <input
              type="checkbox"
              id="examFormActiveToggle"
              ${isActive ? "checked" : ""}
              style="width: 20px; height: 20px; accent-color: var(--color-success);"
            />
            <span class="text-xs font-bold" style="color: var(--color-text-primary);">
              تفعيل الامتحان وإتاحته للطلاب فور النشر
            </span>
          </label>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for the entire Exam Form Modal shell.
 * @returns {string}
 */
export function renderExamFormModal() {
  const bodyHtml = `
    <form id="adminExamMultiStepForm" novalidate onsubmit="return false;">
      <div id="examFormStepperSlot">
        ${renderExamFormStepper(1)}
      </div>

      <div id="examFormStepContainer">
        ${renderExamInfoStep({})}
      </div>
    </form>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-between w-full flex-wrap gap-2">
      <div>
        <button type="button" id="examFormPrevStepBtn" class="btn btn-secondary d-none">
          ← السابق
        </button>
      </div>

      <div class="d-flex items-center gap-2">
        <button type="button" id="examFormDraftBtn" class="btn btn-ghost text-muted">
          حفظ كمسودة 📝
        </button>
        <button type="button" id="examFormNextStepBtn" class="btn btn-primary">
          التالي: الأسئلة →
        </button>
        <button type="button" id="examFormPublishBtn" class="btn btn-success d-none">
          حفظ ونشر الامتحان 🚀
        </button>
      </div>
    </div>
  `;

  return renderModal({
    id: EXAM_FORM_MODAL_ID,
    title: `<span id="examFormModalHeaderTitle">إنشاء امتحان جديد</span>`,
    bodyHtml,
    footerHtml,
    maxWidth: "800px"
  });
}
