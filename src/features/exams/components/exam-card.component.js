// src/features/exams/components/exam-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

/**
 * Returns HTML string for student exam card.
 */
export function renderStudentExamCard({ exam, result }) {
  const isCompleted = !!result;
  let statusBadge;

  if (isCompleted) {
    statusBadge = renderBadge({ text: `تم الحل: ${result.score ?? "—"}`, variant: "success", icon: "✓" });
  } else if (exam.active === false) {
    statusBadge = renderBadge({ text: "مغلق حالياً", variant: "danger", icon: "🔒" });
  } else {
    statusBadge = renderBadge({ text: "متاح الآن", variant: "gold", icon: "⭐" });
  }

  const durationMin = Number(exam.duration) || 15;
  const questionsCount = exam.questions ? exam.questions.length : (exam.questionCount || "متعدد");

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-3">
      ${statusBadge}
      <span class="text-xs text-muted">⏱️ المدة: ${durationMin} دقيقة</span>
    </div>
    <h4 class="font-extrabold mb-2" style="font-size:1.15rem;line-height:1.4;">${escapeHtml(exam.title || "امتحان بدون عنوان")}</h4>
    <div class="d-flex items-center gap-3 text-xs text-muted mt-2">
      <span>❓ عدد الأسئلة: <strong>${questionsCount}</strong></span>
      ${exam.group && exam.group !== "ALL" ? `<span>👥 المجموعة: <strong>${escapeHtml(exam.group)}</strong></span>` : ""}
    </div>
    ${
      isCompleted
        ? `
      <div class="p-3 mt-3 d-flex items-center justify-between" style="background:var(--color-bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--color-border-subtle);">
        <span class="text-xs text-muted">درجتك المعتمدة:</span>
        <strong class="text-accent font-extrabold" style="font-size:1.15rem;">${escapeHtml(result.score)} <span class="text-xs text-muted">/ ${escapeHtml(result.totalQuestions || 100)}</span></strong>
      </div>
    `
        : ""
    }
  `;

  let footerHtml = "";
  if (!isCompleted && exam.active !== false) {
    footerHtml = renderButton({
      text: "بدء الامتحان الآن 📝",
      variant: "primary",
      className: "w-full btn-md",
      extraAttrs: `data-start-exam="${escapeHtml(exam.id)}" data-exam-title="${escapeHtml(exam.title || "")}"`
    });
  } else if (isCompleted) {
    footerHtml = renderButton({
      text: "عرض النتيجة والتقرير 📊",
      variant: "secondary",
      className: "w-full",
      extraAttrs: `data-view-exam-result="${escapeHtml(exam.id)}"`
    });
  } else {
    footerHtml = `<span class="text-xs text-muted text-center w-full d-block py-1">هذا الاختبار غير متاح حالياً</span>`;
  }

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}

/**
 * Returns HTML string for teacher exam card.
 */
export function renderTeacherExamCard({ exam }) {
  const isActive = exam.active !== false;
  const statusBadge = isActive
    ? renderBadge({ text: "مفعل للطلاب", variant: "success", icon: "✓" })
    : renderBadge({ text: "معطل", variant: "danger", icon: "🔒" });

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-2">
      ${statusBadge}
      <span class="text-xs text-muted">⏱️ ${escapeHtml(exam.duration || 15)} دقيقة</span>
    </div>
    <h4 class="font-bold mb-2" style="font-size:1.05rem;">${escapeHtml(exam.title || "امتحان بدون عنوان")}</h4>
    <div class="text-xs text-muted mb-2">
      <span>المجموعة: ${renderBadge({ text: exam.group || "ALL", variant: "gold" })}</span>
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-2 w-full justify-between">
      ${renderButton({
        text: "النتائج 📊",
        size: "sm",
        variant: "secondary",
        extraAttrs: `data-teacher-view-results="${escapeHtml(exam.id)}" data-exam-title="${escapeHtml(exam.title || "")}"`
      })}
      <div class="d-flex gap-1">
        ${renderButton({
          text: isActive ? "تعطيل" : "تفعيل",
          size: "sm",
          variant: isActive ? "warning" : "success",
          extraAttrs: `data-teacher-toggle-exam="${escapeHtml(exam.id)}" data-current-active="${isActive}"`
        })}
        ${renderButton({
          text: "حذف",
          size: "sm",
          variant: "danger",
          extraAttrs: `data-teacher-delete-exam="${escapeHtml(exam.id)}" data-exam-title="${escapeHtml(exam.title || "")}"`
        })}
      </div>
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}
