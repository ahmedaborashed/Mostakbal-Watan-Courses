// src/features/exams/components/exam-question.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";

/**
 * Returns HTML string for a single exam question card.
 */
export function renderExamQuestion({ question, index, currentAnswer = "", totalQuestions = 0 }) {
  const qNum = index + 1;
  const isEssay = question.type === "essay";

  let optionsHtml = "";
  if (isEssay) {
    optionsHtml = `
      <div class="mt-4">
        <label class="form-label" for="essay_q_${index}">
          <span>إجابتك التحريرية:</span>
        </label>
        <textarea
          id="essay_q_${index}"
          class="form-textarea"
          data-question-index="${index}"
          data-answer-input="essay"
          rows="5"
          placeholder="اكتب إجابتك البرمجية أو التحليلية هنا بالتفصيل..."
          style="font-family:inherit;font-size:0.95rem;line-height:1.6;"
        >${escapeHtml(currentAnswer)}</textarea>
      </div>
    `;
  } else {
    // MCQ options
    const options = question.options || [];
    optionsHtml = `
      <div class="d-flex flex-col gap-3 mt-4" role="radiogroup" aria-label="خيارات السؤال ${qNum}">
        ${options
          .map((opt, optIdx) => {
            const isChecked = String(currentAnswer) === String(optIdx) ? "checked" : "";
            const optionId = `q_${index}_opt_${optIdx}`;
            return `
            <label
              for="${optionId}"
              class="d-flex items-center gap-3 option-label-card"
              style="background:var(--color-bg-secondary);padding:0.9rem 1.2rem;border-radius:var(--radius-md);border:1px solid var(--color-border-subtle);cursor:pointer;transition:all var(--transition-fast);"
            >
              <input
                type="radio"
                id="${optionId}"
                name="question_${index}"
                value="${optIdx}"
                data-question-index="${index}"
                data-answer-input="mcq"
                ${isChecked}
                style="width:20px;height:20px;accent-color:var(--color-primary);margin:0;cursor:pointer;"
              />
              <span class="text-sm font-semibold" style="flex:1;">${escapeHtml(opt)}</span>
            </label>
          `;
          })
          .join("")}
      </div>
    `;
  }

  return `
    <article class="card mb-4" id="question_box_${index}" style="padding:var(--space-6);">
      <div class="d-flex items-center justify-between mb-3">
        <div class="d-flex items-center gap-2">
          ${renderBadge({ text: `السؤال ${qNum} ${totalQuestions ? `من ${totalQuestions}` : ""}`, variant: "gold", icon: "📌" })}
        </div>
        <span class="text-xs text-muted font-bold">${isEssay ? "سؤال مقالي / كود ✍️" : "اختيار من متعدد 🔘"}</span>
      </div>
      <h3 style="font-size:1.2rem;font-weight:800;line-height:1.6;color:var(--color-text-primary);margin:0;">
        ${escapeHtml(question.question || question.title || "")}
      </h3>
      ${optionsHtml}
    </article>
  `;
}
