// src/features/exams/components/exam-details.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";
import { renderExamStatusBadge } from "./exam-status-badge.component.js";

export const EXAM_DETAILS_MODAL_ID = "adminExamDetailsModal";

/**
 * Returns HTML string for the inner content of the Exam Details view.
 * @param {object} options
 * @param {object} options.exam
 * @param {Array} [options.results=[]]
 * @returns {string}
 */
export function renderExamDetailsContent({ exam, results = [] }) {
  if (!exam) {
    return `<div class="p-6 text-center text-muted">لم يتم العثور على بيانات الامتحان.</div>`;
  }

  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  const totalQuestions = questions.length;
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.degree) || 1), 0);
  const duration = Number(exam.duration) || 30;
  const passDegree = Number(exam.passDegree) || 0;
  const letters = ["أ", "ب", "ج", "د", "هـ", "و"];

  // Real statistics calculation
  const attemptsCount = results.length;
  let avgScoreDisplay = "—";
  let highestScoreDisplay = "—";
  let passCount = 0;

  if (attemptsCount > 0) {
    const scores = results.map((r) => Number(r.score || r.total || 0));
    const sumScore = scores.reduce((a, b) => a + b, 0);
    avgScoreDisplay = (sumScore / attemptsCount).toFixed(1);
    highestScoreDisplay = Math.max(...scores);
    const passThreshold = passDegree > 0 ? passDegree : totalScore * 0.5;
    passCount = scores.filter((s) => s >= passThreshold).length;
  }

  const passRateDisplay = attemptsCount > 0 ? `${Math.round((passCount / attemptsCount) * 100)}%` : "—";

  // Date strings
  let dateText = "—";
  if (exam.startDate || exam.deadline) {
    const parts = [];
    if (exam.startDate) parts.push(`فتح: ${formatDate(exam.startDate)}`);
    if (exam.deadline) parts.push(`غلق: ${formatDate(exam.deadline)}`);
    dateText = parts.join(" · ");
  } else if (exam.createdAt) {
    dateText = formatDate(exam.createdAt);
  }

  return `
    <div class="exam-details-view">
      <!-- Top Overview Header -->
      <div class="card p-4 mb-4" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <div class="d-flex items-center gap-2 mb-1">
              ${renderExamStatusBadge(exam)}
              <span class="badge badge-gold font-bold">المجموعة: ${escapeHtml(exam.group || "جميع المجموعات")}</span>
            </div>
            <h3 class="font-black" style="font-size: 1.35rem; color: var(--color-text-primary); margin: 0;">
              ${escapeHtml(exam.title || "امتحان بدون عنوان")}
            </h3>
          </div>
          <div class="d-flex items-center gap-2">
            ${renderButton({
              text: "تعديل الامتحان ✏️",
              size: "sm",
              variant: "secondary",
              extraAttrs: `data-details-edit-exam="${escapeHtml(exam.id)}"`
            })}
          </div>
        </div>

        ${
          exam.description
            ? `<p class="text-muted text-xs mb-3" style="line-height: 1.6;">${escapeHtml(exam.description)}</p>`
            : ""
        }

        <!-- Key Parameters Bar -->
        <div class="grid-4 gap-2 p-3 mt-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); font-size: var(--font-size-xs);">
          <div>
            <span class="text-muted d-block mb-1">⏱️ مدة الاختبار:</span>
            <strong style="color: var(--color-text-primary);">${duration} دقيقة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">📝 عدد الأسئلة:</span>
            <strong style="color: var(--color-text-primary);">${totalQuestions} سؤال</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">🎯 الدرجة الكلية:</span>
            <strong class="text-accent">${totalScore} درجة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">📅 التوقيت:</span>
            <span style="color: var(--color-text-secondary);">${escapeHtml(dateText)}</span>
          </div>
        </div>
      </div>

      <!-- Real Statistics Section -->
      <div class="mb-4">
        <h4 class="font-bold text-xs text-muted mb-2">📊 مؤشرات الأداء الحقيقية (من واقع نتائج الطلاب الفعلية):</h4>
        <div class="grid-4 gap-2">
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">إجمالي المحاولات</span>
            <span class="stat-value font-black text-primary" style="font-size: 1.4rem;">${attemptsCount}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">متوسط الدرجات</span>
            <span class="stat-value font-black text-accent" style="font-size: 1.4rem;">${avgScoreDisplay}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">أعلى درجة مرصودة</span>
            <span class="stat-value font-black text-success" style="font-size: 1.4rem;">${highestScoreDisplay}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">نسبة النجاح</span>
            <span class="stat-value font-black ${passRateDisplay !== "—" ? "text-success" : "text-muted"}" style="font-size: 1.4rem;">${passRateDisplay}</span>
          </div>
        </div>
      </div>

      <!-- Full Questions Breakdown (ADMIN ONLY) -->
      <div class="exam-questions-breakdown">
        <div class="d-flex items-center justify-between mb-3">
          <h4 class="font-extrabold text-sm" style="color: var(--color-text-primary);">
            📝 تفاصيل الأسئلة ومفاتيح الإجابات النموذجية (${totalQuestions}):
          </h4>
          <span class="badge badge-neutral text-xs">🔐 عرض مخصص للمدير</span>
        </div>

        <div class="d-flex flex-col gap-3">
          ${
            questions.length === 0
              ? `<div class="card text-center p-6 text-muted text-xs">لا توجد أسئلة مضافة لهذا الامتحان.</div>`
              : questions
                  .map((q, idx) => {
                    const isMcq = q.type !== "essay";
                    const correctIdx = Number(q.correct) || 0;
                    const degree = Number(q.degree) || 1;
                    const options = Array.isArray(q.options) ? q.options : [];

                    return `
                    <div class="card p-4" style="border: 1px solid var(--color-border-subtle); background: var(--color-surface-elevated);">
                      <div class="d-flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div class="d-flex items-center gap-2">
                          ${renderBadge({ text: `السؤال ${idx + 1}`, variant: "gold", className: "font-bold" })}
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

                      <h5 class="font-extrabold mb-3" style="font-size: 1.05rem; line-height: 1.5; color: var(--color-text-primary);">
                        ${escapeHtml(q.question || "")}
                      </h5>

                      ${
                        isMcq
                          ? `
                        <div class="d-flex flex-col gap-2">
                          ${options
                            .map((opt, optIdx) => {
                              const isCorrect = optIdx === correctIdx;
                              const letter = letters[optIdx] || `#${optIdx + 1}`;
                              return `
                              <div
                                class="d-flex items-center gap-2 p-2 px-3"
                                style="border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? "var(--color-success)" : "var(--color-border-subtle)"}; background: ${isCorrect ? "var(--color-bg-secondary)" : "transparent"};"
                              >
                                <span class="badge ${isCorrect ? "badge-success" : "badge-neutral"}" style="min-width: 24px; text-align: center;">
                                  ${letter}
                                </span>
                                <span class="text-sm font-medium" style="flex: 1; color: var(--color-text-primary);">
                                  ${escapeHtml(opt)}
                                </span>
                                ${isCorrect ? `<span class="badge badge-success text-xs">الإجابة النموذجية الصحيحة ✓</span>` : ""}
                              </div>
                            `;
                            })
                            .join("")}
                        </div>
                      `
                          : `
                        <div class="p-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border-inline-start: 3px solid var(--color-primary);">
                          <span class="text-xs text-muted font-bold d-block">إجابة مقالية يكتبها الطالب في مربع نصي حر.</span>
                        </div>
                      `
                      }
                    </div>
                  `;
                  })
                  .join("")
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for the Admin Exam Details Modal shell.
 * @returns {string}
 */
export function renderExamDetailsModal() {
  return renderModal({
    id: EXAM_DETAILS_MODAL_ID,
    title: "تفاصيل الامتحان والإحصاءات",
    bodyHtml: `<div id="adminExamDetailsBodySlot" class="p-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-end w-full">
        <button type="button" class="btn btn-secondary" data-modal-close="${EXAM_DETAILS_MODAL_ID}">
          إغلاق النافذة
        </button>
      </div>
    `,
    maxWidth: "840px"
  });
}
