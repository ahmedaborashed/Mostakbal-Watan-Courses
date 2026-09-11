// src/features/exams/components/exam-review.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for a single reviewed question.
 * @param {object} question
 * @param {number} index
 * @returns {string}
 */
export function renderReviewQuestionCard(question, index) {
  const isMcq = question.type !== "essay";
  const qNum = index + 1;
  const degree = Number(question.degree) || 1;
  const options = Array.isArray(question.options) ? question.options : [];
  const correctIdx = Number(question.correct) || 0;
  const letters = ["أ", "ب", "ج", "د", "هـ", "و"];

  let optionsReviewHtml = "";
  if (isMcq) {
    optionsReviewHtml = `
      <div class="options-review-grid d-flex flex-col gap-2 mt-3">
        ${options
          .map((opt, optIdx) => {
            const isCorrect = optIdx === correctIdx;
            const letter = letters[optIdx] || `#${optIdx + 1}`;
            return `
            <div
              class="d-flex items-center gap-2 p-2 px-3 option-review-row"
              style="border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? "var(--color-success)" : "var(--color-border-subtle)"}; background: ${isCorrect ? "var(--color-bg-secondary)" : "transparent"};"
            >
              <span class="badge ${isCorrect ? "badge-success" : "badge-neutral"}" style="min-width: 24px; text-align: center;">
                ${letter}
              </span>
              <span class="text-sm font-medium" style="flex: 1; color: var(--color-text-primary);">
                ${escapeHtml(opt)}
              </span>
              ${isCorrect ? `<span class="badge badge-success text-xs">الإجابة الصحيحة ✓</span>` : ""}
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  } else {
    optionsReviewHtml = `
      <div class="p-3 mt-2" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border-inline-start: 3px solid var(--color-primary);">
        <span class="text-xs text-muted font-bold d-block">إجابة مقالية / كود تحريري:</span>
        <span class="text-xs text-muted">سيقوم الطالب بكتابة الإجابة في مساحة نصية مخصصة، ليتم تقييمها لاحقاً من لوحة المعلم.</span>
      </div>
    `;
  }

  return `
    <div class="card mb-3 p-4 review-question-card" style="border: 1px solid var(--color-border-subtle); background: var(--color-surface-elevated);">
      <div class="d-flex items-center justify-between mb-2 flex-wrap gap-2">
        <div class="d-flex items-center gap-2">
          ${renderBadge({ text: `السؤال ${qNum}`, variant: "gold", className: "font-bold" })}
          ${
            isMcq
              ? renderBadge({ text: "اختيار من متعدد", variant: "info", className: "text-xs" })
              : renderBadge({ text: "سؤال مقالي", variant: "neutral", className: "text-xs" })
          }
        </div>
        <span class="badge badge-outline text-xs" style="color: var(--color-text-secondary);">
          ${degree} ${degree === 1 ? "درجة" : "درجات"}
        </span>
      </div>

      <h5 class="font-extrabold mb-2" style="font-size: 1.05rem; line-height: 1.5; color: var(--color-text-primary);">
        ${escapeHtml(question.question || "سؤال بدون نص")}
      </h5>

      ${optionsReviewHtml}
    </div>
  `;
}

/**
 * Returns HTML string for the Step 3 Exam Review component.
 * @param {object} options
 * @param {object} options.examData
 * @param {Array} options.questions
 * @returns {string}
 */
export function renderExamReview({ examData = {}, questions = [] }) {
  const title = examData.title || "امتحان بدون عنوان";
  const description = examData.description || "لا يوجد وصف مدخل.";
  const group = examData.group || "جميع المجموعات";
  const duration = Number(examData.duration) || 30;
  const passDegree = Number(examData.passDegree) || 0;
  const totalQuestions = questions.length;
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.degree) || 1), 0);

  let dateInfo = "غير محدد";
  if (examData.startDate || examData.deadline) {
    const parts = [];
    if (examData.startDate) parts.push(`تاريخ البدء: ${formatDate(examData.startDate)}`);
    if (examData.deadline) parts.push(`الموعد النهائي: ${formatDate(examData.deadline)}`);
    dateInfo = parts.join(" · ");
  }

  return `
    <div class="exam-review-container">
      <!-- Top Banner Summary -->
      <div class="card mb-4 p-4" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <span class="badge badge-gold mb-1">مراجعة الامتحان قبل النشر</span>
            <h3 class="font-black" style="font-size: 1.35rem; color: var(--color-text-primary); margin: 0;">
              ${escapeHtml(title)}
            </h3>
          </div>
          <div class="d-flex items-center gap-2">
            ${
              examData.active !== false
                ? renderBadge({ text: "سيُنشر كنشط", variant: "success", icon: "✓" })
                : renderBadge({ text: "سيُحفظ كمسودة", variant: "neutral", icon: "📝" })
            }
          </div>
        </div>

        <p class="text-muted text-xs mb-4" style="line-height: 1.6;">${escapeHtml(description)}</p>

        <!-- Exam Attributes Grid -->
        <div class="grid-3 gap-3 p-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); font-size: var(--font-size-xs);">
          <div>
            <span class="text-muted d-block mb-1">المجموعة المستهدفة:</span>
            <strong style="color: var(--color-text-primary);">${escapeHtml(group)}</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">المدة الزمنية:</span>
            <strong style="color: var(--color-text-primary);">${duration} دقيقة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">درجة النجاح:</span>
            <strong style="color: var(--color-text-primary);">${passDegree > 0 ? `${passDegree} درجة` : "تلقائي"}</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">إجمالي الأسئلة:</span>
            <strong class="text-primary">${totalQuestions} سؤال</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">مجموع الدرجات:</span>
            <strong class="text-accent">${totalScore} درجة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">الجدول الزمني:</span>
            <span style="color: var(--color-text-secondary);">${escapeHtml(dateInfo)}</span>
          </div>
        </div>
      </div>

      <!-- Questions List Title -->
      <div class="d-flex items-center justify-between mb-3">
        <h4 class="font-bold text-sm" style="color: var(--color-text-primary);">
          قائمة الأسئلة المعدة (${totalQuestions}):
        </h4>
        <span class="text-xs text-muted">يرجى التأكد من الإجابات النموذجية لأسئلة الاختيار من متعدد</span>
      </div>

      <!-- Questions Cards List -->
      <div class="review-questions-list">
        ${
          questions.length > 0
            ? questions.map((q, idx) => renderReviewQuestionCard(q, idx)).join("")
            : `<div class="card text-center p-6 text-muted text-xs">لم يتم إضافة أي أسئلة للمراجعة.</div>`
        }
      </div>
    </div>
  `;
}
