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

      <!-- Staff Student Engagement Section (Staff Only) -->
      ${
        !isStudent
          ? `
        <hr class="lesson-details-divider" />
        <div class="lesson-detail-section" id="lessonEngagementSection">
          <div class="d-flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 class="lesson-section-title m-0">
              <span aria-hidden="true">📊</span>
              <span>تفاعل ومشاهدات الطلاب</span>
            </h4>
            <span class="badge badge-gold text-xs">مؤشرات حقيقية من سجلات المشاهدة</span>
          </div>
          <div id="lessonEngagementContentSlot">
            <div class="p-4 text-center text-muted" style="background:var(--color-bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--color-border-subtle);">
              <div class="spinner mb-2"></div>
              <div>جاري تحميل بيانات تفاعل الطلاب... ⏳</div>
            </div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

/**
 * Returns HTML string for the Student Engagement content inside lesson details.
 * @param {object} options
 * @param {object} options.engagement
 * @param {string} [options.searchQuery=""]
 * @param {"watched"|"unwatched"} [options.activeTab="watched"]
 * @returns {string}
 */
export function renderEngagementContent({ engagement, searchQuery = "", activeTab = "watched" }) {
  if (!engagement) {
    return `<div class="p-4 text-center text-muted">تعذر جلب بيانات التفاعل.</div>`;
  }

  const { totalCount, watchedCount, unwatchedCount, watchPercentage, watchedList = [], unwatchedList = [] } = engagement;

  const q = (searchQuery || "").trim().toLowerCase();

  const filteredWatched = watchedList.filter((s) => {
    if (!q) return true;
    return (s.studentName || "").toLowerCase().includes(q) || (s.studentPhone || "").includes(q);
  });

  const filteredUnwatched = unwatchedList.filter((s) => {
    if (!q) return true;
    return (s.studentName || "").toLowerCase().includes(q) || (s.studentPhone || "").includes(q);
  });

  return `
    <div class="lesson-engagement-wrapper">
      <!-- Top Metrics KPIs -->
      <div class="grid-4 gap-2 mb-4" style="font-size:var(--font-size-xs);">
        <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.25rem;">
          <span class="stat-label text-xs">إجمالي الطلاب</span>
          <span class="stat-value font-black text-primary" style="font-size:1.3rem;">${totalCount}</span>
        </div>
        <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.25rem;">
          <span class="stat-label text-xs">✅ شاهدوا المحاضرة</span>
          <span class="stat-value font-black text-success" style="font-size:1.3rem;">${watchedCount}</span>
        </div>
        <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.25rem;">
          <span class="stat-label text-xs">❌ لم يشاهدوا</span>
          <span class="stat-value font-black text-danger" style="font-size:1.3rem;">${unwatchedCount}</span>
        </div>
        <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.25rem;">
          <span class="stat-label text-xs">نسبة المشاهدة</span>
          <span class="stat-value font-black text-accent" style="font-size:1.3rem;">${watchPercentage}%</span>
        </div>
      </div>

      <!-- Search & Tabs Bar -->
      <div class="d-flex items-center justify-between gap-3 flex-wrap mb-3">
        <div class="academic-filter-tabs" style="margin:0;">
          <button
            type="button"
            class="academic-filter-btn ${activeTab === 'watched' ? 'active' : ''}"
            data-engagement-tab="watched"
          >
            <span>شاهدوا المحاضرة</span>
            <span class="filter-badge-count text-success">${watchedCount}</span>
          </button>
          <button
            type="button"
            class="academic-filter-btn ${activeTab === 'unwatched' ? 'active' : ''}"
            data-engagement-tab="unwatched"
          >
            <span>لم يشاهدوا بعد</span>
            <span class="filter-badge-count text-danger">${unwatchedCount}</span>
          </button>
        </div>

        <div style="min-width:200px;flex:1;max-width:320px;">
          <input
            type="search"
            id="lessonEngagementSearchInput"
            class="form-input form-input-sm"
            placeholder="🔍 بحث باسم الطالب..."
            value="${escapeHtml(searchQuery)}"
            aria-label="بحث في قائمة المشاهدات"
          />
        </div>
      </div>

      <!-- Lists -->
      ${
        activeTab === "watched"
          ? `
        <div class="engagement-list-container">
          ${
            filteredWatched.length === 0
              ? `<div class="card p-4 text-center text-muted text-xs">
                  ${q ? 'لا يوجد طلاب مطابقون لبحثك في قائمة المشاهدين.' : 'لم يقم أي طالب بمشاهدة هذه المحاضرة بعد.'}
                 </div>`
              : `
              <div class="table-wrapper" style="max-height:260px;overflow-y:auto;border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
                <table class="table-modern" style="margin:0;font-size:var(--font-size-xs);">
                  <thead>
                    <tr>
                      <th>الطالب</th>
                      <th>المجموعة</th>
                      <th>عدد المرات</th>
                      <th>آخر مشاهدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredWatched
                      .map((s) => `
                      <tr>
                        <td>
                          <strong>${escapeHtml(s.studentName)}</strong>
                          <span class="text-muted d-block" style="font-size:0.75rem;direction:ltr;text-align:right;">${escapeHtml(s.studentPhone || '')}</span>
                        </td>
                        <td><span class="badge badge-gold">${escapeHtml(s.group)}</span></td>
                        <td><span class="badge badge-neutral">${s.watchCount || 1} مرات</span></td>
                        <td><span class="text-muted">${escapeHtml(s.lastOpenedFormatted || '—')}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>
      `
          : `
        <div class="engagement-list-container">
          ${
            filteredUnwatched.length === 0
              ? `<div class="card p-4 text-center text-success text-xs font-bold">
                  ${q ? 'لا يوجد طلاب مطابقون لبحثك في قائمة غير المشاهدين.' : '🎉 جميع الطلاب المؤهلين شاهدوا هذه المحاضرة!'}
                 </div>`
              : `
              <div class="table-wrapper" style="max-height:260px;overflow-y:auto;border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);">
                <table class="table-modern" style="margin:0;font-size:var(--font-size-xs);">
                  <thead>
                    <tr>
                      <th>الطالب</th>
                      <th>المجموعة</th>
                      <th>رقم الهاتف</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredUnwatched
                      .map((s) => `
                      <tr>
                        <td><strong>${escapeHtml(s.studentName)}</strong></td>
                        <td><span class="badge badge-gold">${escapeHtml(s.group)}</span></td>
                        <td><span style="direction:ltr;display:inline-block;">${escapeHtml(s.studentPhone || '—')}</span></td>
                        <td><span class="badge badge-danger">لم يشاهد ❌</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>
      `
      }
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
    maxWidth: "760px"
  });
}

