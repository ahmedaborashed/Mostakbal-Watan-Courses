// src/features/lectures/components/lesson-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { extractYouTubeId } from "../../../shared/validators/url.validator.js";

/**
 * Returns HTML string for the Student Lesson Card (Student Lesson Library).
 * Follows the calm, professional educational LMS UX specifications.
 * @param {object} params
 * @param {object} params.lesson
 * @param {boolean} params.isWatched
 * @returns {string}
 */
export function renderStudentLessonCard({ lesson, isWatched = false }) {
  const safeId = escapeHtml(lesson.id || "");
  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const rawDesc = (lesson.description || "").trim();
  const safeDesc = rawDesc ? escapeHtml(rawDesc) : "لا يوجد وصف مضاف لهذه المحاضرة.";
  const hasDesc = Boolean(rawDesc);
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const groupName = lesson.group === "ALL" ? "جميع المجموعات" : (lesson.group ? `المجموعة ${lesson.group}` : "عام");
  const safeGroup = escapeHtml(groupName);

  const ytId = extractYouTubeId(lesson.videoUrl || lesson.videoId || "");
  const hasVideo = Boolean(lesson.videoUrl || lesson.videoId);
  const hasFile = Boolean(lesson.fileUrl);
  const resourceCount = Array.isArray(lesson.resources) ? lesson.resources.length : 0;

  // 1. Media Preview / Thumbnail (Compact, no wasted empty 30-40% block)
  let mediaHtml = "";
  if (ytId) {
    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    mediaHtml = `
      <div class="student-lesson-media-wrap">
        <div class="student-lesson-thumb">
          <img src="${escapeHtml(thumbUrl)}" alt="${safeTitle}" loading="lazy" />
          <div class="student-lesson-thumb-overlay" aria-hidden="true">
            <span class="student-lesson-play-pill">▶</span>
          </div>
        </div>
      </div>
    `;
  } else if (hasVideo) {
    mediaHtml = `
      <div class="student-lesson-media-strip">
        <span class="media-strip-icon" aria-hidden="true">▶</span>
        <span class="media-strip-text">فيديو تعليمي مرفق</span>
      </div>
    `;
  } else {
    // No video: compact notice, NOT wasting 30-40% card space
    mediaHtml = `
      <div class="student-lesson-no-video">
        <span aria-hidden="true">🎥</span>
        <span>لا يوجد فيديو لهذه المحاضرة</span>
      </div>
    `;
  }

  // 2. Top Content Type & Availability Row (Compact, not multiple giant badges)
  const availChips = [];
  if (hasVideo) {
    availChips.push(`<span class="lesson-avail-chip has-video" title="فيديو مسجل متاح"><span aria-hidden="true">🎥</span> فيديو</span>`);
  }
  if (hasFile) {
    availChips.push(`<span class="lesson-avail-chip has-file" title="ملف تعليمي متاح"><span aria-hidden="true">📄</span> ملف متاح</span>`);
  }
  if (resourceCount > 0) {
    availChips.push(`<span class="lesson-avail-chip has-resources" title="${resourceCount} مصادر إضافية"><span aria-hidden="true">📦</span> ${resourceCount} مصادر</span>`);
  }

  // 3. Status Indicators (Muted, non-neon, informative)
  const statusBadgeHtml = isWatched
    ? `<span class="lesson-status-chip is-watched"><span aria-hidden="true">✓</span> تمت المشاهدة</span>`
    : `<span class="lesson-status-chip is-unwatched"><span aria-hidden="true">●</span> لم تتم المشاهدة</span>`;

  return `
    <article class="card student-lesson-card" data-lesson-id="${safeId}">
      ${mediaHtml}

      <div class="student-lesson-body">
        <!-- Availability Chips -->
        <div class="student-lesson-avail-row" aria-label="المحتويات المتوفرة">
          ${availChips.join("")}
        </div>

        <!-- Title -->
        <h3 class="student-lesson-title" title="${safeTitle}">
          ${safeTitle}
        </h3>

        <!-- Description (Clamped 2-3 lines with subtle fallback) -->
        <p class="student-lesson-desc ${!hasDesc ? 'is-fallback' : ''}">
          ${safeDesc}
        </p>

        <!-- Compact Metadata Row (Date & Group) -->
        <div class="student-lesson-meta-row">
          <span class="meta-item" title="تاريخ المحاضرة">
            <span class="meta-icon" aria-hidden="true">📅</span>
            <span>${safeDate}</span>
          </span>
          <span class="meta-separator" aria-hidden="true">·</span>
          <span class="meta-item" title="المجموعة المستهدفة">
            <span class="meta-icon" aria-hidden="true">👥</span>
            <span>${safeGroup}</span>
          </span>
        </div>

        <!-- Content Status (Watched & File availability) -->
        <div class="student-lesson-status-row">
          ${statusBadgeHtml}
          ${hasFile ? `<span class="lesson-file-status"><span aria-hidden="true">📄</span> ملف متاح</span>` : ""}
        </div>
      </div>

      <!-- Primary Action -->
      <div class="student-lesson-footer">
        <button
          type="button"
          class="btn btn-primary w-full student-lesson-primary-btn"
          data-open-student-lesson="${safeId}"
          aria-label="فتح المحاضرة: ${safeTitle}"
        >
          <span>فتح المحاضرة</span>
          <span class="btn-arrow" aria-hidden="true">←</span>
        </button>
      </div>
    </article>
  `;
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
