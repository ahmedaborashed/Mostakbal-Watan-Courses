// src/features/exams/components/exam-question.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"];

/**
 * Returns HTML string for a single focused exam question card in Exam Mode.
 */
export function renderExamQuestion({
  question,
  index,
  currentAnswer = "",
  totalQuestions = 0
}) {
  if (!question) return "";

  const qNum = index + 1;
  const isEssay = question.type === "essay";
  const degree = Number(question.degree || 1);

  let optionsHtml = "";
  if (isEssay) {
    const charCount = typeof currentAnswer === "string" ? currentAnswer.length : 0;
    optionsHtml = `
      <div class="mt-4 essay-input-wrapper">
        <label class="form-label mb-2 d-flex items-center justify-between" for="essay_q_${index}">
          <span class="font-bold">اكتب إجابتك هنا:</span>
          <span id="essayCharCount" class="text-xs text-muted font-medium">${charCount} حرف</span>
        </label>
        <textarea
          id="essay_q_${index}"
          class="form-textarea essay-textarea"
          data-question-index="${index}"
          data-answer-input="essay"
          rows="8"
          placeholder="اكتب إجابتك هنا..."
          style="font-family: inherit; font-size: 1rem; line-height: 1.7; width: 100%; resize: vertical;"
        >${escapeHtml(currentAnswer)}</textarea>
        <p class="text-xs text-muted mt-2 mb-0">
          💡 الإجابة تُحفظ تلقائياً في الذاكرة ويمكنك مراجعتها في أي وقت قبل التسليم.
        </p>
      </div>
    `;
  } else {
    // MCQ options
    const options = Array.isArray(question.options) ? question.options : [];
    optionsHtml = `
      <div class="mcq-options-list mt-4" role="radiogroup" aria-label="خيارات السؤال ${qNum}">
        ${options
          .map((opt, optIdx) => {
            const isChecked =
              currentAnswer !== "" &&
              currentAnswer !== null &&
              currentAnswer !== undefined &&
              String(currentAnswer) === String(optIdx);

            const letter = OPTION_LETTERS[optIdx] || String(optIdx + 1);
            const optionId = `q_${index}_opt_${optIdx}`;

            return `
            <label
              for="${optionId}"
              class="exam-option-card ${isChecked ? "is-selected" : ""}"
            >
              <input
                type="radio"
                id="${optionId}"
                name="question_${index}"
                value="${optIdx}"
                data-question-index="${index}"
                data-answer-input="mcq"
                ${isChecked ? "checked" : ""}
                class="sr-only"
              />
              <span class="option-marker" aria-hidden="true">
                ${isChecked ? `✓ ${letter}` : letter}
              </span>
              <span class="option-text">${escapeHtml(opt)}</span>
            </label>
          `;
          })
          .join("")}
      </div>
    `;
  }

  return `
    <article class="exam-question-card card p-6" id="question_box_${index}">
      <div class="d-flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="d-flex items-center gap-2">
          ${renderBadge({
            text: `السؤال ${qNum} من ${totalQuestions || "—"}`,
            variant: "primary",
            icon: "📌"
          })}
          <span class="text-xs text-muted font-bold">
            ${degree} ${degree === 1 ? "درجة" : "درجات"}
          </span>
        </div>
        <span class="badge ${isEssay ? "badge-gold" : "badge-secondary"} text-xs font-semibold">
          ${isEssay ? "✍️ سؤال تحريري / مقالي" : "🔘 اختيار من متعدد"}
        </span>
      </div>

      <h3 class="exam-question-title font-black mb-3">
        ${escapeHtml(question.question || question.title || "")}
      </h3>

      ${optionsHtml}
    </article>
  `;
}
