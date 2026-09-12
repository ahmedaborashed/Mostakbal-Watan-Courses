// src/features/lectures/components/lesson-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { extractYouTubeId, isValidSafeUrl } from "../../../shared/validators/url.validator.js";

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
 * Redesigned with generous breathing room, rich media preview, comprehensive specs details,
 * and an uncrowded 2-tier action toolbar where buttons never overlap.
 * @param {object} params
 * @param {object} params.lesson
 * @returns {string}
 */
export function renderTeacherLessonCard({ lesson }) {
  const safeId = escapeHtml(lesson.id || "");
  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const rawDesc = (lesson.description || "").trim();
  const safeDesc = rawDesc ? escapeHtml(rawDesc) : "لا يوجد وصف مضاف لهذه المحاضرة.";
  const hasDesc = Boolean(rawDesc);
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const groupName = lesson.group === "ALL" ? "جميع المجموعات" : (lesson.group ? `المجموعة: ${lesson.group}` : "عام للجميع");
  const safeGroup = escapeHtml(groupName);
  const isActive = lesson.active !== false;

  const ytId = extractYouTubeId(lesson.videoUrl || lesson.videoId || "");
  const hasVideo = Boolean(lesson.videoUrl || lesson.videoId);
  const hasFile = Boolean(lesson.fileUrl);
  const resourceCount = Array.isArray(lesson.resources) ? lesson.resources.length : 0;

  const safeFileUrl = (hasFile && isValidSafeUrl(lesson.fileUrl)) ? escapeHtml(lesson.fileUrl) : "";
  const rawVideoUrl = lesson.videoUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : "");
  const safeVideoUrl = (rawVideoUrl && isValidSafeUrl(rawVideoUrl)) ? escapeHtml(rawVideoUrl) : "";

  // 1. Media Preview Banner / Strip
  let mediaHtml = "";
  if (ytId) {
    const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    mediaHtml = `
      <div class="teacher-card-media-banner">
        <img src="${escapeHtml(thumbUrl)}" alt="${safeTitle}" loading="lazy" class="teacher-card-thumb" />
        <div class="teacher-card-thumb-overlay" aria-hidden="true">
          <span class="teacher-card-play-icon">▶</span>
        </div>
        <div class="teacher-card-media-badge">
          <span>🎥 فيديو مسجل</span>
        </div>
      </div>
    `;
  } else if (hasVideo) {
    mediaHtml = `
      <div class="teacher-card-media-strip has-video">
        <span class="media-strip-icon" aria-hidden="true">🎥</span>
        <span class="media-strip-text">فيديو تعليمي مسجل</span>
        ${safeVideoUrl ? `
          <a href="${safeVideoUrl}" target="_blank" rel="noopener noreferrer" class="teacher-card-link-action" title="مشاهدة رابط الفيديو">
            <span>مشاهدة</span>
            <span aria-hidden="true">↗</span>
          </a>
        ` : ""}
      </div>
    `;
  } else {
    mediaHtml = `
      <div class="teacher-card-media-strip no-video">
        <span class="media-strip-icon" aria-hidden="true">🎥</span>
        <span class="media-strip-text">لم يتم إرفاق رابط فيديو للمحاضرة</span>
      </div>
    `;
  }

  // 2. Status & Group Badges
  const statusBadge = isActive
    ? `<span class="badge badge-success teacher-status-pill"><span class="pill-dot">●</span> نشطة</span>`
    : `<span class="badge badge-secondary teacher-status-pill is-disabled"><span class="pill-dot">○</span> معطلة</span>`;

  const groupBadge = `<span class="badge badge-gold teacher-group-pill" title="${safeGroup}"><span aria-hidden="true">👥</span> <span class="group-text">${safeGroup}</span></span>`;

  // 3. Details & Materials Specs Box (Shows full lecture assets clearly)
  const specsHtml = `
    <div class="teacher-card-specs-box" aria-label="تفاصيل المحاضرة والمرفقات">
      <div class="specs-item ${hasVideo ? 'is-available' : 'is-empty'}">
        <div class="specs-lead">
          <span class="specs-icon" aria-hidden="true">🎥</span>
          <span class="specs-label">الفيديو:</span>
          <span class="specs-val">${hasVideo ? 'متوفر' : 'بدون فيديو'}</span>
        </div>
        ${safeVideoUrl ? `
          <a href="${safeVideoUrl}" target="_blank" rel="noopener noreferrer" class="specs-link-btn" title="فتح رابط الفيديو">
            فتح ↗
          </a>
        ` : ''}
      </div>

      <div class="specs-item ${hasFile ? 'is-available' : 'is-empty'}">
        <div class="specs-lead">
          <span class="specs-icon" aria-hidden="true">📄</span>
          <span class="specs-label">المرفق:</span>
          <span class="specs-val">${hasFile ? 'ملف متاح' : 'بدون ملف'}</span>
        </div>
        ${safeFileUrl ? `
          <a href="${safeFileUrl}" target="_blank" rel="noopener noreferrer" class="specs-link-btn" title="تحميل أو فتح الملف المرفق">
            تحميل 📥
          </a>
        ` : ''}
      </div>

      ${resourceCount > 0 ? `
        <div class="specs-item is-available">
          <div class="specs-lead">
            <span class="specs-icon" aria-hidden="true">📦</span>
            <span class="specs-label">المصادر:</span>
            <span class="specs-val font-bold">${resourceCount} مصادر إضافية</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  return `
    <article class="card teacher-lesson-card ${!isActive ? 'is-disabled' : ''}" data-lesson-id="${safeId}">
      ${mediaHtml}

      <div class="teacher-card-inner-body">
        <!-- Top Bar: Group + Status Badge + Date -->
        <div class="teacher-card-header-bar">
          <div class="teacher-card-pills-wrap">
            ${groupBadge}
            ${statusBadge}
          </div>
          <div class="teacher-card-date-wrap" title="تاريخ الجلسة">
            <span aria-hidden="true">📅</span>
            <span>${safeDate}</span>
          </div>
        </div>

        <!-- Title -->
        <h4 class="teacher-card-title" title="${safeTitle}">
          ${safeTitle}
        </h4>

        <!-- Description -->
        <p class="teacher-card-desc ${!hasDesc ? 'is-fallback' : ''}">
          ${safeDesc}
        </p>

        <!-- Detailed Specs Box -->
        ${specsHtml}
      </div>

      <!-- Actions Footer: 2-tier layout with zero collision -->
      <div class="teacher-card-actions-wrap">
        <!-- Tier 1: Prominent Primary Action -->
        <button
          type="button"
          class="btn btn-primary w-full teacher-view-details-btn"
          data-teacher-view-lesson="${safeId}"
          aria-label="عرض تفاصيل المحاضرة: ${safeTitle}"
        >
          <span>👁️</span>
          <span>عرض التفاصيل والمحتوى</span>
        </button>

        <!-- Tier 2: Management Controls in 3-column Grid -->
        <div class="teacher-card-management-grid">
          <button
            type="button"
            class="btn btn-secondary btn-sm teacher-action-btn"
            data-teacher-edit-lesson="${safeId}"
            aria-label="تعديل المحاضرة: ${safeTitle}"
          >
            <span>✏️</span>
            <span>تعديل</span>
          </button>

          <button
            type="button"
            class="btn ${isActive ? 'btn-ghost' : 'btn-success'} btn-sm teacher-action-btn"
            data-teacher-toggle-status="${safeId}"
            data-current-active="${isActive}"
            aria-label="تغيير حالة المحاضرة: ${safeTitle}"
          >
            <span>${isActive ? '⏸️' : '▶️'}</span>
            <span>${isActive ? 'تعطيل' : 'تفعيل'}</span>
          </button>

          <button
            type="button"
            class="btn btn-danger btn-sm teacher-action-btn"
            data-teacher-delete-lesson="${safeId}"
            data-lesson-title="${safeTitle}"
            aria-label="حذف المحاضرة: ${safeTitle}"
          >
            <span>🗑️</span>
            <span>حذف</span>
          </button>
        </div>
      </div>
    </article>
  `;
}
