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
    statusBadge = renderBadge({ text: "مغلق", variant: "danger", icon: "🔒" });
  } else {
    statusBadge = renderBadge({ text: "متاح الآن", variant: "gold", icon: "⭐" });
  }

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-3">
      ${statusBadge}
      <span class="text-sm text-muted">⏱️ المدة: ${escapeHtml(exam.duration || 15)} دقيقة</span>
    </div>
    <h4 class="font-bold mb-2" style="font-size:1.1rem;">${escapeHtml(exam.title || "امتحان بدون عنوان")}</h4>
    ${
      isCompleted
        ? `<p class="text-sm text-muted mt-2">درجتك: <strong class="text-accent">${escapeHtml(result.score)}</strong> / ${escapeHtml(result.totalQuestions || 100)}</p>`
        : ""
    }
  `;

  let footerHtml = "";
  if (!isCompleted && exam.active !== false) {
    footerHtml = renderButton({
      text: "بدء الامتحان الآن 📝",
      variant: "primary",
      className: "w-full",
      extraAttrs: `data-start-exam="${escapeHtml(exam.id)}" data-exam-title="${escapeHtml(exam.title || "")}"`
    });
  } else if (isCompleted) {
    footerHtml = renderButton({
      text: "عرض النتيجة بالتفصيل 📊",
      variant: "secondary",
      className: "w-full",
      extraAttrs: `data-view-exam-result="${escapeHtml(exam.id)}"`
    });
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
    ? renderBadge({ text: "مفعل للطلاب", variant: "success" })
    : renderBadge({ text: "غير مفعل", variant: "danger" });

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-2">
      ${statusBadge}
      <span class="text-xs text-muted">⏱️ ${escapeHtml(exam.duration || 15)} دقيقة</span>
    </div>
    <h4 class="font-bold mb-3">${escapeHtml(exam.title || "امتحان بدون عنوان")}</h4>
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
          extraAttrs: `data-teacher-delete-exam="${escapeHtml(exam.id)}"`
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
