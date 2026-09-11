// src/features/lectures/components/lesson-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { extractYouTubeId } from "../../../shared/validators/url.validator.js";

/**
 * Returns HTML string for the Student Lesson Card.
 * @param {object} params
 * @param {object} params.lesson
 * @param {boolean} params.isWatched
 * @returns {string}
 */
export function renderStudentLessonCard({ lesson, isWatched = false }) {
  const safeId = escapeHtml(lesson.id);
  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const safeDesc = escapeHtml(lesson.description || "لا يوجد وصف للمحاضرة.");
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const safeGroup = escapeHtml(lesson.group || "ALL");

  const ytId = extractYouTubeId(lesson.videoUrl || lesson.videoId || "");
  const hasVideo = Boolean(lesson.videoUrl || lesson.videoId);
  const hasFile = Boolean(lesson.fileUrl);
  const resourceCount = Array.isArray(lesson.resources) ? lesson.resources.length : 0;

  const watchedBadge = isWatched
    ? renderBadge({ text: "تمت المشاهدة", variant: "success", icon: "✓" })
    : renderBadge({ text: "درس جديد", variant: "primary", icon: "✨" });

  const groupBadge = renderBadge({ text: safeGroup, variant: "gold", icon: "👥" });

  // Thumbnail logic: YouTube thumbnail if available, or calm educational placeholder
  let thumbnailHtml = "";
  if (ytId) {
    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    thumbnailHtml = `
      <div class="lesson-card-thumb" style="position:relative;width:100%;height:150px;border-radius:var(--radius-sm);overflow:hidden;margin-bottom:var(--space-3);background:var(--bg-secondary);">
        <img src="${escapeHtml(thumbUrl)}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
        <div class="lesson-thumb-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:grid;place-items:center;transition:background var(--transition-fast);">
          <div style="width:42px;height:42px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:1.1rem;box-shadow:var(--shadow-sm);">▶</div>
        </div>
      </div>
    `;
  } else {
    thumbnailHtml = `
      <div class="lesson-card-thumb" style="position:relative;width:100%;height:110px;border-radius:var(--radius-sm);background:var(--surface-secondary);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:var(--space-3);gap:0.25rem;">
        <span style="font-size:2rem;" aria-hidden="true">${hasVideo ? "🎥" : "📚"}</span>
        <span class="text-xs text-muted">${hasVideo ? "فيديو تعليمي مسجل" : "جلسة تدريبية"}</span>
      </div>
    `;
  }

  // Indicators row
  const indicators = [];
  if (hasVideo) {
    indicators.push(`<span class="lesson-indicator-chip" title="فيديو متوفر"><span aria-hidden="true">🎥</span> فيديو</span>`);
  }
  if (hasFile) {
    indicators.push(`<span class="lesson-indicator-chip" title="ملف تعليمي مرفق"><span aria-hidden="true">📄</span> ملف</span>`);
  }
  if (resourceCount > 0) {
    indicators.push(`<span class="lesson-indicator-chip" title="${resourceCount} مصادر إضافية"><span aria-hidden="true">📦</span> ${resourceCount} مصادر</span>`);
  }

  const contentHtml = `
    ${thumbnailHtml}
    <div class="d-flex items-center justify-between mb-2 gap-2 flex-wrap">
      <div class="d-flex items-center gap-1">
        ${watchedBadge}
        ${groupBadge}
      </div>
      <span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:0.25rem;">
        <span aria-hidden="true">📅</span> ${safeDate}
      </span>
    </div>

    <h4 class="font-bold mb-2 text-primary" style="font-size:1.05rem;line-height:1.4;">${safeTitle}</h4>

    <p class="text-xs text-secondary mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;min-height:2.4em;">
      ${safeDesc}
    </p>

    <div class="d-flex items-center gap-2 mb-1 flex-wrap">
      ${indicators.join("")}
    </div>
  `;

  const footerHtml = renderButton({
    text: "فتح المحاضرة ←",
    variant: isWatched ? "outline" : "primary",
    className: "w-full",
    extraAttrs: `data-open-student-lesson="${safeId}" aria-label="فتح تفاصيل المحاضرة: ${safeTitle}"`
  });

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true,
    className: "student-lesson-card"
  });
}

/**
 * Returns HTML string for the Teacher / Admin Management Card.
 * @param {object} params
 * @param {object} params.lesson
 * @returns {string}
 */
export function renderTeacherLessonCard({ lesson }) {
  const safeId = escapeHtml(lesson.id);
  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const safeDesc = escapeHtml(lesson.description || "لا يوجد وصف للمحاضرة.");
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const safeGroup = escapeHtml(lesson.group || "ALL");
  const isActive = lesson.active !== false;

  const hasVideo = Boolean(lesson.videoUrl || lesson.videoId);
  const hasFile = Boolean(lesson.fileUrl);
  const resourceCount = Array.isArray(lesson.resources) ? lesson.resources.length : 0;

  const statusBadge = isActive
    ? renderBadge({ text: "نشطة", variant: "success", icon: "●" })
    : renderBadge({ text: "معطلة", variant: "secondary", icon: "○" });

  const groupBadge = renderBadge({ text: safeGroup, variant: "gold", icon: "👥" });

  const indicators = [];
  indicators.push(
    `<span class="lesson-indicator-chip ${hasVideo ? 'active' : 'muted'}" title="${hasVideo ? 'فيديو متوفر' : 'بدون فيديو'}">
      <span aria-hidden="true">🎥</span> ${hasVideo ? 'فيديو' : 'بدون فيديو'}
    </span>`
  );
  indicators.push(
    `<span class="lesson-indicator-chip ${hasFile ? 'active' : 'muted'}" title="${hasFile ? 'ملف مرفق' : 'بدون ملف'}">
      <span aria-hidden="true">📄</span> ${hasFile ? 'ملف' : 'بدون ملف'}
    </span>`
  );
  if (resourceCount > 0) {
    indicators.push(
      `<span class="lesson-indicator-chip active" title="${resourceCount} مصادر إضافية">
        <span aria-hidden="true">📦</span> ${resourceCount} مصادر
      </span>`
    );
  }

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-3 gap-2 flex-wrap">
      <div class="d-flex items-center gap-1">
        ${groupBadge}
        ${statusBadge}
      </div>
      <span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:0.25rem;">
        <span aria-hidden="true">📅</span> ${safeDate}
      </span>
    </div>

    <h4 class="font-bold mb-2 text-primary" style="font-size:1.05rem;line-height:1.4;">${safeTitle}</h4>

    <p class="text-xs text-secondary mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;min-height:2.4em;">
      ${safeDesc}
    </p>

    <div class="d-flex items-center gap-2 mb-1 flex-wrap">
      ${indicators.join("")}
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-between w-full gap-2 flex-wrap">
      <div class="d-flex items-center gap-1">
        ${renderButton({
          text: "تفاصيل",
          size: "sm",
          variant: "outline",
          extraAttrs: `data-teacher-view-lesson="${safeId}" aria-label="عرض تفاصيل المحاضرة: ${safeTitle}"`
        })}
        ${renderButton({
          text: "تعديل ✏️",
          size: "sm",
          variant: "secondary",
          extraAttrs: `data-teacher-edit-lesson="${safeId}" aria-label="تعديل المحاضرة: ${safeTitle}"`
        })}
      </div>

      <div class="d-flex items-center gap-1">
        ${renderButton({
          text: isActive ? "تعطيل ⏸" : "تفعيل ▶",
          size: "sm",
          variant: isActive ? "ghost" : "success",
          extraAttrs: `data-teacher-toggle-status="${safeId}" data-current-active="${isActive}" aria-label="تغيير حالة المحاضرة: ${safeTitle}"`
        })}
        ${renderButton({
          text: "حذف 🗑️",
          size: "sm",
          variant: "danger",
          extraAttrs: `data-teacher-delete-lesson="${safeId}" data-lesson-title="${safeTitle}" aria-label="حذف المحاضرة: ${safeTitle}"`
        })}
      </div>
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true,
    className: "teacher-lesson-card"
  });
}
