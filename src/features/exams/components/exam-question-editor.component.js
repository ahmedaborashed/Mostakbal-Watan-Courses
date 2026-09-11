// src/features/exams/components/exam-question-editor.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

/**
 * Returns HTML string for an option input row inside an MCQ editor.
 * @param {object} options
 * @param {number} options.questionIndex
 * @param {number} options.optionIndex
 * @param {string} options.value
 * @param {boolean} options.isCorrect
 * @param {boolean} options.canRemove
 * @returns {string}
 */
export function renderOptionRow({ questionIndex, optionIndex, value = "", isCorrect = false, canRemove = true }) {
  const letters = ["أ", "ب", "ج", "د", "هـ", "و"];
  const letterLabel = letters[optionIndex] || `#${optionIndex + 1}`;
  const radioId = `q_${questionIndex}_correct_${optionIndex}`;

  return `
    <div class="d-flex items-center gap-2 option-row" data-option-row="${optionIndex}" style="margin-bottom: var(--space-2);">
      <!-- Radio selector for correct answer -->
      <label for="${radioId}" class="d-flex items-center gap-1 cursor-pointer" title="تحديد كإجابة نموذجية صحيحة" style="margin: 0; user-select: none;">
        <input
          type="radio"
          id="${radioId}"
          name="q_${questionIndex}_correct"
          value="${optionIndex}"
          class="option-correct-radio"
          data-q-idx="${questionIndex}"
          data-opt-idx="${optionIndex}"
          ${isCorrect ? "checked" : ""}
          style="width: 18px; height: 18px; accent-color: var(--color-success); cursor: pointer;"
        />
        <span class="badge ${isCorrect ? "badge-success" : "badge-neutral"}" style="min-width: 26px; text-align: center; font-weight: bold;">${letterLabel}</span>
      </label>

      <!-- Option text input -->
      <input
        type="text"
        class="form-input form-input-sm option-text-input"
        data-q-idx="${questionIndex}"
        data-opt-idx="${optionIndex}"
        placeholder="نص الخيار ${letterLabel}..."
        value="${escapeHtml(value)}"
        required
        style="flex: 1; font-size: var(--font-size-xs);"
      />

      <!-- Remove Option Button -->
      ${
        canRemove
          ? `
        <button
          type="button"
          class="btn btn-ghost btn-sm text-danger btn-remove-option"
          data-q-idx="${questionIndex}"
          data-opt-idx="${optionIndex}"
          title="حذف هذا الخيار"
          aria-label="حذف الخيار ${letterLabel}"
          style="padding: 0.3rem 0.5rem; min-height: auto;"
        >
          &times;
        </button>
      `
          : ""
      }
    </div>
  `;
}

/**
 * Returns HTML string for the inline editor body of a single question.
 * @param {object} question
 * @param {number} index
 * @returns {string}
 */
export function renderQuestionInlineEditor(question, index) {
  const isMcq = question.type !== "essay";
  const options = Array.isArray(question.options) && question.options.length > 0 ? question.options : ["", ""];
  const correctIdx = question.correct !== undefined && question.correct !== null ? Number(question.correct) : 0;
  const degree = Number(question.degree) || 1;

  return `
    <div class="question-editor-body p-4" data-editor-body="${index}" style="background: var(--color-surface-elevated); border-top: 1px solid var(--color-border-subtle); border-radius: 0 0 var(--radius-md) var(--radius-md);">
      <!-- Question Type & Degree row -->
      <div class="d-flex items-center justify-between gap-3 flex-wrap mb-3">
        <div class="d-flex items-center gap-2">
          <label class="form-label mb-0 text-xs font-bold">نوع السؤال:</label>
          <div class="d-flex gap-1" role="radiogroup" aria-label="نوع السؤال">
            <button
              type="button"
              class="btn btn-sm ${isMcq ? "btn-primary" : "btn-secondary"} btn-change-type"
              data-q-idx="${index}"
              data-new-type="mcq"
            >
              اختيار من متعدد 🔘
            </button>
            <button
              type="button"
              class="btn btn-sm ${!isMcq ? "btn-primary" : "btn-secondary"} btn-change-type"
              data-q-idx="${index}"
              data-new-type="essay"
            >
              سؤال مقالي ✍️
            </button>
          </div>
        </div>

        <div class="d-flex items-center gap-2">
          <label class="form-label mb-0 text-xs font-bold" for="q_${index}_degree">الدرجة:</label>
          <input
            type="number"
            id="q_${index}_degree"
            class="form-input form-input-sm text-center q-degree-input"
            data-q-idx="${index}"
            value="${degree}"
            min="1"
            max="100"
            style="width: 75px;"
            required
          />
        </div>
      </div>

      <!-- Question Text Prompt -->
      <div class="form-group mb-3">
        <label class="form-label text-xs font-bold" for="q_${index}_text">
          نص السؤال <span class="text-danger">*</span>
        </label>
        <textarea
          id="q_${index}_text"
          class="form-textarea q-text-input"
          data-q-idx="${index}"
          rows="3"
          placeholder="اكتب صيغة السؤال هنا بوضوح ودقة..."
          required
          style="font-size: var(--font-size-sm); line-height: 1.6;"
        >${escapeHtml(question.question || "")}</textarea>
      </div>

      <!-- MCQ Specific Fields -->
      ${
        isMcq
          ? `
        <div class="mcq-options-container mb-3 p-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle);">
          <div class="d-flex items-center justify-between mb-2">
            <span class="text-xs font-bold" style="color: var(--color-text-primary);">
              خيارات الإجابة (حدد الدائرة الخضراء بجانب الإجابة النموذجية الصحيحة):
            </span>
            ${
              options.length < 6
                ? `
              <button type="button" class="btn btn-ghost btn-sm text-primary btn-add-option" data-q-idx="${index}" style="padding: 0.2rem 0.6rem; font-size: var(--font-size-xs);">
                + إضافة خيار
              </button>
            `
                : ""
            }
          </div>

          <div class="options-list-slot" data-options-list="${index}">
            ${options
              .map((opt, optIdx) =>
                renderOptionRow({
                  questionIndex: index,
                  optionIndex: optIdx,
                  value: opt,
                  isCorrect: correctIdx === optIdx,
                  canRemove: options.length > 2
                })
              )
              .join("")}
          </div>
          <p class="form-hint text-xs text-muted mt-2 mb-0">
            ℹ️ الإجابة الصحيحة سرية ولن تظهر للطلاب في شاشة الاختبار، وتستخدم فقط للتصحيح التلقائي.
          </p>
        </div>
      `
          : `
        <div class="essay-note-box mb-3 p-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px dashed var(--color-border-subtle);">
          <p class="text-xs text-muted mb-0">
            ✍️ الأسئلة المقالية تُحل كتابياً بواسطة الطلاب في صفحة الاختبار، وتتطلب تصحيحاً ومراجعة لاحقة من قِبل المعلم لرصد الدرجة.
          </p>
        </div>
      `
      }

      <div class="d-flex justify-end pt-2">
        <button type="button" class="btn btn-sm btn-secondary btn-collapse-question" data-q-idx="${index}">
          حفظ وتصغير السؤال ✓
        </button>
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for a question item row (expandable and draggable).
 * @param {object} options
 * @param {object} options.question
 * @param {number} options.index
 * @param {number} options.totalQuestions
 * @param {boolean} options.isExpanded
 * @returns {string}
 */
export function renderQuestionRow({ question, index, totalQuestions, isExpanded = false }) {
  const isMcq = question.type !== "essay";
  const qNum = index + 1;
  const degree = Number(question.degree) || 1;
  const snippet = question.question ? question.question.trim() : "سؤال جديد فارغ...";

  return `
    <div
      class="question-editor-card card mb-3 ${isExpanded ? "is-expanded" : ""}"
      id="questionRow_${index}"
      data-question-row="${index}"
      style="padding: 0; overflow: hidden; border: 1px solid var(--color-border-subtle); transition: border-color var(--transition-fast);"
    >
      <!-- Question Card Header Bar -->
      <div
        class="question-card-header d-flex items-center justify-between p-3 gap-2 flex-wrap"
        style="background: var(--color-surface-secondary); cursor: pointer;"
        data-toggle-collapse="${index}"
      >
        <div class="d-flex items-center gap-2" style="flex: 1; min-width: 200px;">
          <!-- Drag Handle -->
          <button
            type="button"
            class="drag-handle-btn btn-ghost"
            title="اسحب لإعادة الترتيب"
            aria-label="اسحب السؤال ${qNum} لإعادة الترتيب"
            data-drag-handle="${index}"
            draggable="true"
            style="cursor: grab; padding: 0.2rem 0.4rem; color: var(--color-text-muted); font-size: 1.1rem; user-select: none; border-radius: var(--radius-xs);"
          >
            ☰
          </button>

          <!-- Number Badge -->
          ${renderBadge({ text: `السؤال ${qNum}`, variant: "gold", className: "q-number-badge font-bold" })}

          <!-- Type Badge -->
          ${
            isMcq
              ? renderBadge({ text: "اختيار من متعدد", variant: "info", className: "text-xs" })
              : renderBadge({ text: "سؤال مقالي", variant: "neutral", className: "text-xs" })
          }

          <!-- Score Badge -->
          <span class="badge badge-outline text-xs" style="color: var(--color-text-secondary);">
            ${degree} ${degree === 1 ? "درجة" : "درجات"}
          </span>

          <!-- Question Prompt Snippet -->
          <strong class="text-sm font-semibold line-clamp-1 ms-2" style="color: var(--color-text-primary); max-width: 320px;">
            ${escapeHtml(snippet)}
          </strong>
        </div>

        <!-- Reorder and Action Buttons -->
        <div class="d-flex items-center gap-1" onclick="event.stopPropagation();">
          <!-- Move Up -->
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-move-up"
            data-q-idx="${index}"
            title="تحريك لأعلى"
            aria-label="تحريك السؤال ${qNum} لأعلى"
            ${index === 0 ? "disabled" : ""}
            style="padding: 0.3rem 0.5rem; min-height: auto;"
          >
            ⬆️
          </button>

          <!-- Move Down -->
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-move-down"
            data-q-idx="${index}"
            title="تحريك لأسفل"
            aria-label="تحريك السؤال ${qNum} لأسفل"
            ${index === totalQuestions - 1 ? "disabled" : ""}
            style="padding: 0.3rem 0.5rem; min-height: auto;"
          >
            ⬇️
          </button>

          <!-- Expand / Collapse Button -->
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-toggle-expand"
            data-q-idx="${index}"
            title="${isExpanded ? "تصغير السؤال" : "تعديل السؤال"}"
            aria-label="${isExpanded ? "تصغير السؤال" : "تعديل السؤال"} ${qNum}"
            style="padding: 0.3rem 0.6rem; min-height: auto;"
          >
            ${isExpanded ? "▲ تصغير" : "✏️ تعديل"}
          </button>

          <!-- Delete Button -->
          <button
            type="button"
            class="btn btn-ghost btn-sm text-danger btn-delete-question"
            data-q-idx="${index}"
            title="حذف هذا السؤال"
            aria-label="حذف السؤال ${qNum}"
            style="padding: 0.3rem 0.5rem; min-height: auto;"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Expandable Question Editor Content -->
      ${isExpanded ? renderQuestionInlineEditor(question, index) : ""}
    </div>
  `;
}

/**
 * Returns HTML string for the Question List step container in the exam form.
 * @param {object} options
 * @param {Array} options.questions
 * @param {number|null} [options.expandedIndex=null]
 * @returns {string}
 */
export function renderQuestionsContainer({ questions = [], expandedIndex = null }) {
  const totalQuestions = questions.length;
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.degree) || 1), 0);

  let questionsListHtml = "";
  if (totalQuestions === 0) {
    questionsListHtml = `
      <div class="card text-center p-8 mb-4" style="background: var(--color-bg-secondary); border: 2px dashed var(--color-border-subtle); border-radius: var(--radius-md);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;" aria-hidden="true">📝</div>
        <h4 class="font-extrabold mb-1" style="color: var(--color-text-primary);">لم يتم إضافة أي أسئلة بعد</h4>
        <p class="text-muted text-xs mb-4">ابدأ بإضافة أسئلة اختيار من متعدد أو أسئلة مقالية لبناء محتوى الامتحان.</p>
        <div class="d-flex items-center justify-center gap-2 flex-wrap">
          <button type="button" class="btn btn-primary btn-add-mcq-btn">
            ➕ إضافة اختيار من متعدد (MCQ)
          </button>
          <button type="button" class="btn btn-secondary btn-add-essay-btn">
            ➕ إضافة سؤال مقالي (Essay)
          </button>
        </div>
      </div>
    `;
  } else {
    questionsListHtml = `
      <div id="questionsSortableList" class="questions-sortable-list mb-4">
        ${questions
          .map((q, idx) =>
            renderQuestionRow({
              question: q,
              index: idx,
              totalQuestions,
              isExpanded: expandedIndex === idx
            })
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="exam-questions-step-wrapper">
      <!-- Questions Summary & Add Bar -->
      <div class="d-flex items-center justify-between gap-3 flex-wrap p-3 mb-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--color-border-subtle);">
        <div class="d-flex items-center gap-3">
          <span class="text-xs font-bold text-muted">
            إجمالي الأسئلة: <strong class="text-primary font-black" style="font-size: 1.05rem;">${totalQuestions}</strong>
          </span>
          <span class="text-muted">·</span>
          <span class="text-xs font-bold text-muted">
            مجموع الدرجات: <strong class="text-accent font-black" style="font-size: 1.05rem;">${totalScore}</strong> درجة
          </span>
        </div>

        <div class="d-flex items-center gap-2 flex-wrap">
          <button type="button" class="btn btn-sm btn-primary btn-add-mcq-btn">
            ➕ سؤال MCQ
          </button>
          <button type="button" class="btn btn-sm btn-secondary btn-add-essay-btn">
            ➕ سؤال مقالي
          </button>
        </div>
      </div>

      <!-- Question List Body -->
      ${questionsListHtml}
    </div>
  `;
}
