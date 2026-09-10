// src/features/exams/components/exam-question.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns HTML string for a single exam question.
 */
export function renderExamQuestion({ question, index, currentAnswer = "" }) {
  const qNum = index + 1;
  const isEssay = question.type === "essay";

  let optionsHtml = "";
  if (isEssay) {
    optionsHtml = `
      <div class="mt-3">
        <textarea
          class="form-textarea"
          data-question-index="${index}"
          data-answer-input="essay"
          rows="4"
          placeholder="اكتب إجابتك بالتفصيل هنا..."
        >${escapeHtml(currentAnswer)}</textarea>
      </div>
    `;
  } else {
    // MCQ options
    const options = question.options || [];
    optionsHtml = `
      <div class="d-flex flex-col gap-2 mt-3">
        ${options
          .map((opt, optIdx) => {
            const isChecked = String(currentAnswer) === String(optIdx) ? "checked" : "";
            const optionId = `q_${index}_opt_${optIdx}`;
            return `
            <label for="${optionId}" class="d-flex items-center gap-2" style="background:var(--bg-secondary);padding:.75rem 1rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);cursor:pointer;">
              <input
                type="radio"
                id="${optionId}"
                name="question_${index}"
                value="${optIdx}"
                data-question-index="${index}"
                data-answer-input="mcq"
                ${isChecked}
                style="width:auto;margin:0;"
              />
              <span class="text-sm">${escapeHtml(opt)}</span>
            </label>
          `;
          })
          .join("")}
      </div>
    `;
  }

  return `
    <div class="card mb-4" id="question_box_${index}">
      <div class="d-flex items-center justify-between mb-2">
        <span class="badge badge-gold">السؤال ${qNum}</span>
        <span class="text-xs text-muted">${isEssay ? "سؤال مقالي ✍️" : "اختيار من متعدد 🔘"}</span>
      </div>
      <h3 style="font-size:1.15rem;font-weight:700;line-height:1.5;">${escapeHtml(question.question || question.title || "")}</h3>
      ${optionsHtml}
    </div>
  `;
}
