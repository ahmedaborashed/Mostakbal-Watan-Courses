// src/features/assignments/components/assignment-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { formatDate, isDeadlinePassed } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for student assignment card.
 */
export function renderStudentAssignmentCard({ assignment, submission }) {
  const isSubmitted = !!submission;
  const isExpired = !isSubmitted && isDeadlinePassed(assignment.deadline);

  let statusBadge;
  if (isSubmitted) {
    const gradeText = submission.grade !== undefined && submission.grade !== null
      ? `تم التقييم: ${submission.grade}/100`
      : "تم التسليم بنجاح ✓";
    statusBadge = renderBadge({ text: gradeText, variant: "success", icon: "✓" });
  } else if (isExpired) {
    statusBadge = renderBadge({ text: "انتهى الموعد", variant: "danger", icon: "⌛" });
  } else {
    statusBadge = renderBadge({ text: "مطلوب تسليمه", variant: "gold", icon: "📌" });
  }

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-2">
      ${statusBadge}
      <span class="text-xs text-muted">الديدلاين: ${formatDate(assignment.deadline)}</span>
    </div>
    <h4 class="font-bold mb-2">${escapeHtml(assignment.title || "تاسك بدون عنوان")}</h4>
    <p class="text-sm text-muted mb-3" style="line-height:1.5;">${escapeHtml(assignment.description || "")}</p>
    ${
      assignment.fileUrl
        ? `<a href="${escapeHtml(assignment.fileUrl)}" target="_blank" class="btn btn-outline btn-sm mb-3">تحميل ملف التاسك 📥</a>`
        : ""
    }
    ${
      submission && submission.feedback
        ? `<div class="p-2 mb-2" style="background:var(--bg-secondary);border-radius:var(--radius-xs);border-right:3px solid var(--accent);"><strong class="text-xs text-accent">ملاحظات المعلم:</strong> <span class="text-xs">${escapeHtml(submission.feedback)}</span></div>`
        : ""
    }
  `;

  let footerHtml = "";
  if (!isSubmitted && !isExpired) {
    footerHtml = renderButton({
      text: "تسليم التاسك 📤",
      variant: "primary",
      className: "w-full",
      extraAttrs: `data-open-task-submit="${escapeHtml(assignment.id)}" data-task-title="${escapeHtml(assignment.title || "")}"`
    });
  } else if (isSubmitted) {
    footerHtml = `<span class="text-xs text-muted text-center w-full">تم إرسال إجابتك بتاريخ ${formatDate(submission.createdAt)}</span>`;
  }

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}

/**
 * Returns HTML string for teacher assignment card.
 */
export function renderTeacherAssignmentCard({ assignment }) {
  const contentHtml = `
    <div class="d-flex items-center justify-between mb-2">
      ${renderBadge({ text: assignment.group || "ALL", variant: "gold" })}
      <span class="text-xs text-muted">الديدلاين: ${formatDate(assignment.deadline)}</span>
    </div>
    <h4 class="font-bold mb-2">${escapeHtml(assignment.title || "تاسك بدون عنوان")}</h4>
    <p class="text-sm text-muted mb-3">${escapeHtml(assignment.description || "")}</p>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-between w-full">
      ${renderButton({
        text: "عرض التسليمات 📋",
        size: "sm",
        variant: "secondary",
        extraAttrs: `data-teacher-view-submissions="${escapeHtml(assignment.id)}" data-task-title="${escapeHtml(assignment.title || "")}"`
      })}
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}
