// src/features/lectures/components/lesson-form-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for a single dynamic resource row in the form.
 * @param {object} [resource]
 * @param {string} [resource.title=""]
 * @param {string} [resource.url=""]
 * @param {string} [resource.type="link"]
 * @param {number} [index=0]
 * @returns {string}
 */
export function renderResourceFormRow(resource = {}, index = 0) {
  const title = escapeHtml(resource.title || "");
  const url = escapeHtml(resource.url || "");
  const type = resource.type || "link";

  return `
    <div class="dynamic-resource-row" data-resource-row>
      <div class="grid-resource-inputs">
        <input
          type="text"
          class="form-input form-input-sm"
          data-resource-title
          placeholder="عنوان المصدر (مثال: كود الدرس)"
          value="${title}"
          aria-label="عنوان المصدر الإضافي"
        />
        <input
          type="url"
          class="form-input form-input-sm"
          data-resource-url
          placeholder="رابط المصدر https://..."
          value="${url}"
          aria-label="رابط المصدر الإضافي"
        />
        <select class="form-select form-select-sm" data-resource-type aria-label="نوع المصدر">
          <option value="file" ${type === "file" ? "selected" : ""}>📄 ملف (PDF/كود)</option>
          <option value="drive" ${type === "drive" ? "selected" : ""}>📦 Google Drive</option>
          <option value="link" ${type === "link" ? "selected" : ""}>🔗 رابط خارجي</option>
        </select>
        <button
          type="button"
          class="btn btn-danger btn-sm btn-icon-only"
          data-remove-resource
          title="حذف هذا المصدر"
          aria-label="حذف المصدر الإضافي"
        >
          ✕
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders the reusable Lesson Form Modal for both Create and Edit operations.
 * @returns {string}
 */
export function renderLessonFormModal() {
  const groupOptionsHtml = `
    <option value="ALL">جميع المجموعات (ALL)</option>
    ${GROUPS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
  `;

  const bodyHtml = `
    <form id="lessonForm" class="lesson-form" onsubmit="return false;" novalidate>
      <input type="hidden" id="lessonFormId" value="" />
      <input type="hidden" id="lessonFormMode" value="create" />

      <!-- Basic Information -->
      <div class="form-section mb-4">
        <h4 class="text-sm font-bold text-primary mb-3" style="display:flex;align-items:center;gap:0.4rem;">
          <span>📌</span>
          <span>المعلومات الأساسية للمحاضرة</span>
        </h4>

        <div class="form-group">
          <label for="lessonFormTitle" class="form-label">
            <span>عنوان المحاضرة <span class="text-danger">*</span></span>
          </label>
          <input
            type="text"
            id="lessonFormTitle"
            class="form-input"
            placeholder="مثال: مقدمة إلى Python والمتغيرات"
            required
          />
          <div id="lessonFormTitleError" class="form-error d-none"></div>
        </div>

        <div class="form-group">
          <label for="lessonFormDescription" class="form-label">
            <span>وصف المحاضرة والمحتوى التعليمي</span>
          </label>
          <textarea
            id="lessonFormDescription"
            class="form-textarea"
            rows="3"
            placeholder="اكتب نبذة توضيحية عما يتعلمه الطالب في هذه المحاضرة والمهام المطلوبة..."
          ></textarea>
        </div>
      </div>

      <!-- Session & Audience Information -->
      <div class="form-section mb-4">
        <h4 class="text-sm font-bold text-primary mb-3" style="display:flex;align-items:center;gap:0.4rem;">
          <span>👥</span>
          <span>بيانات الجلسة والمجموعة</span>
        </h4>

        <div class="grid-2">
          <div class="form-group">
            <label for="lessonFormGroup" class="form-label">
              <span>المجموعة المستهدفة <span class="text-danger">*</span></span>
            </label>
            <select id="lessonFormGroup" class="form-select" required>
              ${groupOptionsHtml}
            </select>
            <div id="lessonFormGroupError" class="form-error d-none"></div>
          </div>

          <div class="form-group">
            <label for="lessonFormDate" class="form-label">
              <span>تاريخ المحاضرة</span>
            </label>
            <input
              type="date"
              id="lessonFormDate"
              class="form-input"
            />
          </div>
        </div>
      </div>

      <!-- Video & Main File Links (Google Drive / YouTube) -->
      <div class="form-section mb-4">
        <h4 class="text-sm font-bold text-primary mb-3" style="display:flex;align-items:center;gap:0.4rem;">
          <span>🎥</span>
          <span>الفيديو والملف الرئيسي</span>
        </h4>

        <div class="form-group">
          <label for="lessonFormVideoUrl" class="form-label">
            <span>رابط الفيديو (Google Drive أو YouTube)</span>
          </label>
          <input
            type="url"
            id="lessonFormVideoUrl"
            class="form-input"
            placeholder="https://drive.google.com/file/d/... أو رابط يوتيوب"
          />
          <span class="form-hint">ضع رابط الفيديو الموجود على Google Drive أو YouTube للمشاهدة المباشرة.</span>
          <div id="lessonFormVideoUrlError" class="form-error d-none"></div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="lessonFormFileUrl" class="form-label">
              <span>رابط ملف المحاضرة (Google Drive)</span>
            </label>
            <input
              type="url"
              id="lessonFormFileUrl"
              class="form-input"
              placeholder="https://drive.google.com/file/d/... (PDF, DOCX, ZIP)"
            />
            <span class="form-hint">رابط المستند التعليمي أو السلايدات على Google Drive.</span>
            <div id="lessonFormFileUrlError" class="form-error d-none"></div>
          </div>

          <div class="form-group">
            <label for="lessonFormFileName" class="form-label">
              <span>اسم الملف المعروض للطالب</span>
            </label>
            <input
              type="text"
              id="lessonFormFileName"
              class="form-input"
              placeholder="مثال: سلايدات المحاضرة الأولى.pdf"
            />
          </div>
        </div>
      </div>

      <!-- Additional Resources Section -->
      <div class="form-section mb-4">
        <div class="d-flex items-center justify-between mb-2">
          <h4 class="text-sm font-bold text-primary" style="display:flex;align-items:center;gap:0.4rem;">
            <span>📦</span>
            <span>المصادر والمواد الإضافية</span>
          </h4>
          <button
            type="button"
            id="addResourceBtn"
            class="btn btn-outline btn-sm"
          >
            ➕ إضافة مصدر
          </button>
        </div>
        <p class="text-xs text-muted mb-3">يمكنك إضافة روابط لملفات إضافية على Drive أو مستودعات GitHub أو مراجع خارجية.</p>

        <div id="lessonResourcesContainer" class="d-flex flex-col gap-2">
          <!-- Dynamic resource rows inserted here -->
        </div>
      </div>

      <!-- Visibility / Active Status -->
      <div class="form-section mb-2 pt-2" style="border-top:1px solid var(--border);">
        <label class="d-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="lessonFormActive" class="form-checkbox" checked />
          <span class="text-sm font-medium text-primary">محاضرة نشطة ومتاحة لطلاب المجموعة</span>
        </label>
        <span class="text-xs text-muted d-block mt-1">عند إلغاء التفعيل، سيتم إخفاء المحاضرة عن بوابة الطلاب مؤقتاً.</span>
      </div>
    </form>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-end gap-2 w-full">
      <button
        type="button"
        id="lessonFormCancelBtn"
        class="btn btn-secondary"
        data-modal-close="lessonFormModal"
      >
        إلغاء
      </button>
      <button
        type="submit"
        form="lessonForm"
        id="lessonFormSubmitBtn"
        class="btn btn-primary"
      >
        حفظ ونشر المحاضرة 🚀
      </button>
    </div>
  `;

  return renderModal({
    id: "lessonFormModal",
    title: `<span id="lessonFormModalTitle">إضافة محاضرة جديدة</span>`,
    bodyHtml,
    footerHtml,
    maxWidth: "680px"
  });
}
