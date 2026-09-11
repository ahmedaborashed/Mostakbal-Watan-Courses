// src/features/lectures/components/lesson-details-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderResourceList } from "./resource-list.component.js";
import { resolveMediaEmbed } from "../../../shared/validators/url.validator.js";

/**
 * Returns HTML string for the Lesson Details Modal body.
 * Implements the calm, readable educational LMS UX specifications.
 * @param {object} lesson
 * @param {object} [options]
 * @param {boolean} [options.isStudent=false]
 * @param {boolean} [options.isWatched=false]
 * @returns {string}
 */
export function renderLessonDetailsContent(lesson, { isStudent = false, isWatched = false } = {}) {
  if (!lesson) {
    return `<div class="text-center py-4 text-muted">لم يتم العثور على بيانات المحاضرة.</div>`;
  }

  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const rawDesc = (lesson.description || "").trim();
  const safeDesc = rawDesc ? escapeHtml(rawDesc) : "لا يوجد وصف مضاف لهذه المحاضرة.";
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const groupName = lesson.group === "ALL" ? "جميع المجموعات" : (lesson.group ? `المجموعة ${lesson.group}` : "عام");
  const safeGroup = escapeHtml(groupName);
  const safeFileUrl = escapeHtml(lesson.fileUrl || "");
  const safeFileName = escapeHtml(lesson.fileName || "ملف المحاضرة الرئيسي");
  const isActive = lesson.active !== false;

  // Status Chip
  const statusChip = isStudent
    ? (isWatched
        ? `<span class="lesson-status-chip is-watched"><span aria-hidden="true">✓</span> تمت المشاهدة</span>`
        : `<span class="lesson-status-chip is-unwatched"><span aria-hidden="true">●</span> لم تتم المشاهدة</span>`)
    : (isActive
        ? `<span class="lesson-status-chip is-watched"><span aria-hidden="true">●</span> نشطة</span>`
        : `<span class="lesson-status-chip is-unwatched"><span aria-hidden="true">○</span> معطلة</span>`);

  // Video resolution
  const videoMedia = resolveMediaEmbed(lesson.videoUrl || lesson.videoId || "");
  const hasVideo = Boolean(lesson.videoUrl || lesson.videoId);

  let videoSectionHtml = "";
  if (hasVideo) {
    let previewFrameHtml = "";
    if (videoMedia.isEmbeddable && videoMedia.embedUrl) {
      previewFrameHtml = `
        <div class="lesson-embed-wrapper mb-3">
          <iframe
            src="${escapeHtml(videoMedia.embedUrl)}"
            title="${safeTitle}"
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:var(--radius-sm);"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }

    videoSectionHtml = `
      ${previewFrameHtml}
      <div class="d-flex items-center gap-2 flex-wrap mt-2">
        <button
          type="button"
          class="btn btn-primary btn-md"
          data-details-play-video="${escapeHtml(lesson.id)}"
          data-video-url="${escapeHtml(lesson.videoUrl || lesson.videoId || "")}"
          data-lesson-title="${safeTitle}"
        >
          <span aria-hidden="true">▶</span>
          <span>مشاهدة الفيديو في المشغل</span>
        </button>
        ${lesson.videoUrl ? `
          <a
            href="${escapeHtml(lesson.videoUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-md"
          >
            <span>فتح في نافذة مستقلة</span>
            <span aria-hidden="true">↗</span>
          </a>
        ` : ""}
      </div>
    `;
  } else {
    videoSectionHtml = `
      <div class="lesson-notice-box">
        <span class="notice-icon" aria-hidden="true">🎥</span>
        <span>لا يوجد فيديو مرفق بهذه المحاضرة.</span>
      </div>
    `;
  }

  // File Section
  let fileSectionHtml = "";
  if (safeFileUrl) {
    fileSectionHtml = `
      <div class="lesson-file-card">
        <div class="lesson-file-icon" aria-hidden="true">📄</div>
        <div class="lesson-file-info">
          <strong class="lesson-file-name">${safeFileName}</strong>
          <span class="lesson-file-sub text-muted text-xs">مستند تعليمي عبر Google Drive</span>
        </div>
        <a
          href="${safeFileUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm"
          aria-label="فتح ملف المحاضرة: ${safeFileName} في نافذة جديدة"
        >
          <span>فتح الملف</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    `;
  } else {
    fileSectionHtml = `
      <div class="lesson-notice-box">
        <span class="notice-icon" aria-hidden="true">📄</span>
        <span>لا يوجد ملف مرفق لهذه المحاضرة.</span>
      </div>
    `;
  }

  // Additional Resources (ONLY shown if resources actually exist)
  const validResources = Array.isArray(lesson.resources) ? lesson.resources.filter((r) => r && (r.title || r.url)) : [];
  let resourcesSectionHtml = "";
  if (validResources.length > 0) {
    resourcesSectionHtml = `
      <hr class="lesson-details-divider" />
      <div class="lesson-detail-section">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">🔗</span>
          <span>مصادر إضافية</span>
        </h4>
        ${renderResourceList(validResources)}
      </div>
    `;
  }

  return `
    <div class="lesson-details-view">
      <!-- Back Navigation for Students -->
      <div class="lesson-details-top-bar">
        <button type="button" class="btn btn-ghost btn-sm lesson-details-back-btn" data-modal-close="lessonDetailsModal" aria-label="العودة إلى الدروس">
          <span aria-hidden="true">←</span>
          <span>العودة إلى الدروس</span>
        </button>
      </div>

      <!-- Header Information -->
      <div class="lesson-details-header">
        <h2 class="lesson-details-title">${safeTitle}</h2>
        <div class="lesson-details-meta">
          <span class="meta-item">
            <span aria-hidden="true">📅</span> ${safeDate}
          </span>
          <span class="meta-separator" aria-hidden="true">·</span>
          <span class="meta-item">
            <span aria-hidden="true">👥</span> ${safeGroup}
          </span>
          <span class="meta-separator" aria-hidden="true">·</span>
          ${statusChip}
        </div>
      </div>

      <hr class="lesson-details-divider" />

      <!-- Full Teacher Description -->
      <div class="lesson-detail-section">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">📝</span>
          <span>عن المحاضرة</span>
        </h4>
        <div class="lesson-description-box ${!rawDesc ? 'is-empty' : ''}">
          ${safeDesc}
        </div>
      </div>

      <hr class="lesson-details-divider" />

      <!-- Educational Video -->
      <div class="lesson-detail-section">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">🎥</span>
          <span>فيديو المحاضرة</span>
        </h4>
        ${videoSectionHtml}
      </div>

      <hr class="lesson-details-divider" />

      <!-- Lecture File -->
      <div class="lesson-detail-section">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">📄</span>
          <span>ملف المحاضرة</span>
        </h4>
        ${fileSectionHtml}
      </div>

      ${resourcesSectionHtml}
    </div>
  `;
}

/**
 * Renders the wrapper modal container for Lesson Details.
 * @returns {string}
 */
export function renderLessonDetailsModal() {
  return renderModal({
    id: "lessonDetailsModal",
    title: `<span id="lessonDetailsModalTitle">تفاصيل المحاضرة</span>`,
    bodyHtml: `<div id="lessonDetailsModalBody" class="py-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-between w-full">
        <div id="lessonDetailsStaffActions"></div>
        <button type="button" class="btn btn-secondary" data-modal-close="lessonDetailsModal">إغلاق</button>
      </div>
    `,
    maxWidth: "720px"
  });
}
