// src/features/exams/components/exam-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";
import { renderExamStatusBadge } from "./exam-status-badge.component.js";

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

/**
 * Returns HTML string for an Admin Exam Card.
 * @param {object} options
 * @param {object} options.exam
 * @param {number} [options.resultsCount=0]
 * @returns {string}
 */
export function renderAdminExamCard({ exam, resultsCount = 0 }) {
  const isActive = exam.active !== false;
  const questionsCount = Array.isArray(exam.questions) ? exam.questions.length : (exam.questionCount || 0);
  const durationMin = Number(exam.duration) || 30;
  const groupLabel = exam.group || "جميع المجموعات";

  // Formatted dates
  let dateDisplay = "—";
  if (exam.startDate || exam.deadline) {
    const parts = [];
    if (exam.startDate) parts.push(`من ${formatDate(exam.startDate)}`);
    if (exam.deadline) parts.push(`إلى ${formatDate(exam.deadline)}`);
    dateDisplay = parts.join(" · ");
  } else if (exam.createdAt) {
    dateDisplay = formatDate(exam.createdAt);
  }

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-3 gap-2">
      <div>${renderExamStatusBadge(exam)}</div>
      <span class="text-xs text-muted font-medium">⏱️ ${durationMin} دقيقة</span>
    </div>

    <h4 class="font-extrabold mb-1" style="font-size: 1.15rem; line-height: 1.4; color: var(--color-text-primary);">
      ${escapeHtml(exam.title || "امتحان بدون عنوان")}
    </h4>

    ${
      exam.description
        ? `<p class="text-muted text-xs mb-3 line-clamp-2" style="min-height: 2.2em; line-height: 1.5;">${escapeHtml(exam.description)}</p>`
        : `<p class="text-muted text-xs mb-3 font-italic" style="min-height: 2.2em; line-height: 1.5;">لا يوجد وصف مضاف</p>`
    }

    <div class="d-flex flex-col gap-2 p-3 mb-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); font-size: var(--font-size-xs);">
      <div class="d-flex items-center justify-between">
        <span class="text-muted">👥 المجموعة:</span>
        <strong style="color: var(--color-text-primary);">${escapeHtml(groupLabel)}</strong>
      </div>
      <div class="d-flex items-center justify-between">
        <span class="text-muted">📝 عدد الأسئلة:</span>
        <strong style="color: var(--color-text-primary);">${questionsCount} سؤال</strong>
      </div>
      <div class="d-flex items-center justify-between">
        <span class="text-muted">📅 التاريخ:</span>
        <span style="color: var(--color-text-secondary); direction: ltr; text-align: right;">${escapeHtml(dateDisplay)}</span>
      </div>
      ${
        resultsCount > 0
          ? `
        <div class="d-flex items-center justify-between pt-1" style="border-top: 1px dashed var(--color-border-subtle);">
          <span class="text-muted">📊 عدد المحاولات:</span>
          <strong class="text-accent font-bold">${resultsCount} طالب</strong>
        </div>
      `
          : ""
      }
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-between gap-1 w-full flex-wrap pt-2" style="border-top: 1px solid var(--color-border-subtle);">
      <div class="d-flex items-center gap-1">
        ${renderButton({
          text: "عرض",
          size: "sm",
          variant: "ghost",
          icon: "👁️",
          className: "btn-admin-view-exam",
          extraAttrs: `data-admin-view-exam="${escapeHtml(exam.id)}" aria-label="عرض تفاصيل الامتحان ${escapeHtml(exam.title || "")}"`
        })}
        ${renderButton({
          text: "تعديل",
          size: "sm",
          variant: "secondary",
          icon: "✏️",
          className: "btn-admin-edit-exam",
          extraAttrs: `data-admin-edit-exam="${escapeHtml(exam.id)}" aria-label="تعديل الامتحان ${escapeHtml(exam.title || "")}"`
        })}
      </div>
      <div class="d-flex items-center gap-1">
        ${renderButton({
          text: isActive ? "تعطيل" : "تفعيل",
          size: "sm",
          variant: isActive ? "warning" : "success",
          icon: isActive ? "⏸️" : "▶️",
          className: "btn-admin-toggle-exam",
          extraAttrs: `data-admin-toggle-exam="${escapeHtml(exam.id)}" data-current-active="${isActive}" data-exam-title="${escapeHtml(exam.title || "")}" aria-label="${isActive ? "تعطيل" : "تفعيل"} الامتحان"`
        })}
        ${renderButton({
          text: "حذف",
          size: "sm",
          variant: "danger",
          icon: "🗑️",
          className: "btn-admin-delete-exam",
          extraAttrs: `data-admin-delete-exam="${escapeHtml(exam.id)}" data-exam-title="${escapeHtml(exam.title || "")}" aria-label="حذف الامتحان"`
        })}
      </div>
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true,
    className: "admin-exam-card"
  });
}
