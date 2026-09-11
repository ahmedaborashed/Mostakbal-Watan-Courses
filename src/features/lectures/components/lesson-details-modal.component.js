// src/features/lectures/components/lesson-details-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderResourceList } from "./resource-list.component.js";
import { resolveMediaEmbed } from "../../../shared/validators/url.validator.js";

/**
 * Returns HTML string for the Lesson Details Modal body.
 * @param {object} lesson
 * @param {boolean} [isStudent=false]
 * @param {boolean} [isWatched=false]
 * @returns {string}
 */
export function renderLessonDetailsContent(lesson, { isStudent = false, isWatched = false } = {}) {
  if (!lesson) {
    return `<div class="text-center py-4 text-muted">لم يتم العثور على بيانات المحاضرة.</div>`;
  }

  const safeTitle = escapeHtml(lesson.title || lesson.name || "محاضرة بدون عنوان");
  const safeDesc = escapeHtml(lesson.description || "لا يوجد وصف لهذه المحاضرة.");
  const safeDate = escapeHtml(lesson.sessionDate || "—");
  const safeGroup = escapeHtml(lesson.group || "ALL");
  const safeFileUrl = escapeHtml(lesson.fileUrl || "");
  const safeFileName = escapeHtml(lesson.fileName || "ملف المحاضرة الرئيسي");
  const isActive = lesson.active !== false;

  // Badges
  const groupBadge = renderBadge({ text: safeGroup, variant: "gold", icon: "👥" });
  const statusBadge = isStudent
    ? (isWatched
        ? renderBadge({ text: "تمت المشاهدة", variant: "success", icon: "✓" })
        : renderBadge({ text: "درس جديد", variant: "primary", icon: "✨" }))
    : (isActive
        ? renderBadge({ text: "نشطة", variant: "success", icon: "●" })
        : renderBadge({ text: "معطلة", variant: "secondary", icon: "○" }));

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
      <div class="d-flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          data-details-play-video="${escapeHtml(lesson.id)}"
          data-video-url="${escapeHtml(lesson.videoUrl || lesson.videoId || "")}"
          data-lesson-title="${safeTitle}"
        >
          ▶ مشاهدة الفيديو في المشغل
        </button>
        ${lesson.videoUrl ? `
          <a
            href="${escapeHtml(lesson.videoUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-sm"
          >
            فتح الرابط في نافذة جديدة ↗
          </a>
        ` : ""}
      </div>
    `;
  } else {
    videoSectionHtml = `
      <div class="lesson-empty-notice">
        <span aria-hidden="true">ℹ️</span>
        <span>لا يوجد فيديو مسجل مرفق بهذه المحاضرة.</span>
      </div>
    `;
  }

  // Main file section
  let fileSectionHtml = "";
  if (safeFileUrl) {
    fileSectionHtml = `
      <div class="lesson-file-card">
        <div class="lesson-file-icon" aria-hidden="true">📄</div>
        <div class="lesson-file-info">
          <strong class="lesson-file-name">${safeFileName}</strong>
          <span class="text-xs text-muted">مستند تعليمي على Google Drive</span>
        </div>
        <a
          href="${safeFileUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-outline btn-sm"
          aria-label="فتح ملف المحاضرة: ${safeFileName} في نافذة جديدة"
        >
          فتح الملف ↗
        </a>
      </div>
    `;
  } else {
    fileSectionHtml = `
      <div class="lesson-empty-notice">
        <span aria-hidden="true">ℹ️</span>
        <span>لا يوجد ملف مرفق لهذه المحاضرة.</span>
      </div>
    `;
  }

  // Additional resources section
  const resourcesHtml = renderResourceList(lesson.resources, {
    emptyText: "لا توجد مصادر أو روابط إضافية مرفقة بهذا الدرس."
  });

  return `
    <div class="lesson-details-view">
      <!-- Meta Header -->
      <div class="lesson-details-header mb-4">
        <div class="d-flex items-center justify-between gap-2 flex-wrap mb-2">
          <div class="d-flex items-center gap-2">
            ${groupBadge}
            ${statusBadge}
          </div>
          <span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:0.3rem;">
            <span aria-hidden="true">📅</span> تاريخ الجلسة: ${safeDate}
          </span>
        </div>
        <h2 class="lesson-details-title">${safeTitle}</h2>
      </div>

      <!-- Description Section -->
      <div class="lesson-detail-section mb-4">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">📝</span>
          <span>عن المحاضرة</span>
        </h4>
        <div class="lesson-description-box">
          ${safeDesc}
        </div>
      </div>

      <!-- Educational Video Section -->
      <div class="lesson-detail-section mb-4">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">🎥</span>
          <span>الفيديو التعليمي</span>
        </h4>
        ${videoSectionHtml}
      </div>

      <!-- Main File Section -->
      <div class="lesson-detail-section mb-4">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">📄</span>
          <span>ملف المحاضرة</span>
        </h4>
        ${fileSectionHtml}
      </div>

      <!-- Additional Resources Section -->
      <div class="lesson-detail-section mb-2">
        <h4 class="lesson-section-title">
          <span aria-hidden="true">📦</span>
          <span>مصادر إضافية</span>
        </h4>
        ${resourcesHtml}
      </div>
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
    maxWidth: "700px"
  });
}
