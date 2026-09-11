// src/features/exams/components/exam-result.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for the Official Exam Result Screen.
 * @param {object} options
 * @param {object} options.exam - The exam metadata
 * @param {object} options.result - The official server result
 * @returns {string}
 */
export function renderExamResult({ exam, result }) {
  if (!result) {
    return `
      <div class="card p-8 text-center" style="max-width: 580px; margin: 2rem auto;">
        <p class="text-muted">لم يتم العثور على نتيجة لهذا الامتحان بعد.</p>
        ${renderButton({
          id: "backToExamsListBtn",
          text: "العودة إلى الامتحانات ↵",
          variant: "secondary"
        })}
      </div>
    `;
  }

  const isPendingEssay = result.status === "pending_essay";
  const examTitle = exam?.title || "الامتحان";
  const mcqScore = result.mcqScore !== undefined ? Number(result.mcqScore) : null;
  const totalScore = result.total !== undefined ? Number(result.total) : Number(result.score || 0);

  // If totalQuestions or totalPossible is available
  const totalPossible =
    result.totalPossible !== undefined
      ? Number(result.totalPossible)
      : result.totalQuestions !== undefined
      ? Number(result.totalQuestions)
      : exam?.totalScore !== undefined
      ? Number(exam.totalScore)
      : exam?.totalQuestions !== undefined
      ? Number(exam.totalQuestions)
      : exam?.passDegree
      ? Math.max(exam.passDegree * 2, totalScore)
      : null;

  const percentage =
    totalPossible && totalPossible > 0
      ? Math.round((totalScore / totalPossible) * 100)
      : null;

  // Format submission date
  let submissionTimeText = "—";
  if (result.submittedAt) {
    submissionTimeText = formatDate(result.submittedAt, {
      showTime: true,
      timeOnly: false
    });
  }

  // Essay scores breakdown
  const hasEssayScores = Array.isArray(result.essayScores) && result.essayScores.length > 0;
  let essaySum = 0;
  let allEssayEvaluated = true;
  if (hasEssayScores) {
    result.essayScores.forEach((s) => {
      if (s === null || s === undefined) {
        allEssayEvaluated = false;
      } else {
        essaySum += Number(s);
      }
    });
  }

  const contentHtml = `
    <div class="exam-result-container text-center py-4">
      <div class="result-celebration-icon mb-3" aria-hidden="true">
        ${isPendingEssay ? "⏳" : percentage && percentage >= 50 ? "🏆" : "📝"}
      </div>

      <h2 class="result-exam-title mb-1 font-black">
        ${escapeHtml(examTitle)}
      </h2>

      <p class="text-muted text-sm mb-4">
        ${
          isPendingEssay
            ? "تم تسجيل إجاباتك بنجاح. النتيجة قيد انتظار تصحيح الأسئلة المقالية."
            : "تم تصحيح الامتحان واعتماد نتيجتك الرسمية عبر السيرفر."
        }
      </p>

      <!-- Main Score Badge Card -->
      <div class="result-score-hero mb-6">
        <div class="score-status-badge mb-2">
          ${
            isPendingEssay
              ? renderBadge({ text: "قيد انتظار التصحيح التحريري", variant: "gold", icon: "⏳" })
              : renderBadge({ text: "نتيجة معتمدة نهائياً", variant: "success", icon: "✓" })
          }
        </div>

        <div class="score-display">
          <span class="score-number">${totalScore}</span>
          ${totalPossible ? `<span class="score-divider">/ ${totalPossible}</span>` : ""}
        </div>

        ${
          percentage !== null && !isPendingEssay
            ? `
          <div class="score-percentage-pill mt-2">
            النسبة المئوية: <strong>${percentage}%</strong>
          </div>
        `
            : ""
        }
      </div>

      <!-- Breakdown Grid (Only if provided by backend) -->
      <div class="result-breakdown-grid mb-6">
        ${
          mcqScore !== null
            ? `
          <div class="breakdown-card">
            <span class="breakdown-label">اختيار من متعدد (MCQ)</span>
            <strong class="breakdown-value text-accent">${mcqScore} درجة</strong>
          </div>
        `
            : ""
        }

        ${
          hasEssayScores
            ? `
          <div class="breakdown-card">
            <span class="breakdown-label">الأسئلة المقالية / التحريرية</span>
            <strong class="breakdown-value ${allEssayEvaluated ? "text-success" : "text-gold"}">
              ${allEssayEvaluated ? `${essaySum} درجة` : "قيد التقييم ⏳"}
            </strong>
          </div>
        `
            : ""
        }

        <div class="breakdown-card">
          <span class="breakdown-label">تاريخ ووقت التسليم</span>
          <strong class="breakdown-value text-muted text-xs">${escapeHtml(submissionTimeText)}</strong>
        </div>
      </div>

      ${
        isPendingEssay
          ? `
        <div class="alert alert-info mb-6 text-start text-xs" style="line-height: 1.6;">
          <strong>ملاحظة:</strong> الدرجة الحالية تشمل درجات الأسئلة الموضوعية فقط. سيقوم المعلم بمراجعة وتقييم إجاباتك المقالية وتحديث النتيجة النهائية تلقائياً.
        </div>
      `
          : ""
      }
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-center gap-3 w-full">
      ${renderButton({
        id: "backToExamsListBtn",
        text: "العودة إلى قائمة الامتحانات ↵",
        variant: "primary",
        className: "btn-lg w-full",
        extraAttrs: 'style="max-width: 320px;"'
      })}
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    className: "exam-result-card"
  });
}
