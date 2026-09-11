// src/features/assignments/components/assignment-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { formatDate, getDeadlineInfo, isDeadlinePassed } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for the redesigned student assignment summary card.
 * Answers 4 questions in 3 seconds:
 * 1. What is this task?
 * 2. When is it due?
 * 3. What is my status?
 * 4. What should I click?
 * @param {object} options
 * @param {object} options.assignment
 * @param {object|null} options.submission
 * @returns {string}
 */
export function renderStudentAssignmentCard({ assignment, submission }) {
  const isSubmitted = !!submission;
  const isExpired = !isSubmitted && isDeadlinePassed(assignment.deadline);
  const deadlineInfo = getDeadlineInfo(assignment.deadline);

  // 1. Status Badge Resolution
  let statusBadgeHtml;
  let statusChipHtml;

  if (isSubmitted) {
    const isGraded = submission.grade !== undefined && submission.grade !== null;
    if (isGraded) {
      statusBadgeHtml = renderBadge({
        text: `تم التصحيح: ${submission.grade}/100`,
        variant: "success",
        icon: "✓"
      });
      statusChipHtml = `<span class="assignment-status-pill is-graded"><span class="status-dot">●</span> تم التصحيح (${submission.grade}/100)</span>`;
    } else {
      statusBadgeHtml = renderBadge({
        text: "تم التسليم",
        variant: "success",
        icon: "✓"
      });
      statusChipHtml = `<span class="assignment-status-pill is-submitted"><span class="status-dot">●</span> قيد التصحيح</span>`;
    }
  } else if (isExpired) {
    statusBadgeHtml = renderBadge({
      text: "انتهى الموعد",
      variant: "danger",
      icon: "🔴"
    });
    statusChipHtml = `<span class="assignment-status-pill is-expired"><span class="status-dot">●</span> منتهي</span>`;
  } else if (deadlineInfo.isUrgent) {
    statusBadgeHtml = renderBadge({
      text: deadlineInfo.label,
      variant: "warning",
      icon: "🟡"
    });
    statusChipHtml = `<span class="assignment-status-pill is-urgent"><span class="status-dot">●</span> مطلوب تسليمه عاجلاً</span>`;
  } else {
    statusBadgeHtml = renderBadge({
      text: "مطلوب تسليمه",
      variant: "gold",
      icon: "📌"
    });
    statusChipHtml = `<span class="assignment-status-pill is-pending"><span class="status-dot">●</span> لم يتم التسليم</span>`;
  }

  // 2. Title & Description Normalization
  let displayTitle = (assignment.title || "").trim();
  if (!displayTitle || /^(task|task\s*\d+|تاسك\s*\d*)$/i.test(displayTitle)) {
    displayTitle = assignment.title || "تاسك تطبيقي عملي";
  }
  const safeTitle = escapeHtml(displayTitle);

  const rawDesc = (assignment.description || "").trim();
  const safeDesc = rawDesc
    ? escapeHtml(rawDesc)
    : "تطبيق عملي ومهام برمجية مطلوبة وفق توجيهات المعلم.";

  const groupLabel = assignment.group === "ALL" ? "جميع المجموعات" : (assignment.group || "عام");
  const safeGroup = escapeHtml(groupLabel);

  return `
    <article class="student-assignment-card ${isSubmitted ? 'is-submitted' : ''} ${isExpired ? 'is-expired' : ''}" dir="rtl">
      <!-- Card Header: Badges -->
      <div class="student-assignment-header">
        ${statusBadgeHtml}
        <span class="assignment-group-tag">${safeGroup}</span>
      </div>

      <!-- Card Title -->
      <h3 class="student-assignment-title" title="${safeTitle}">
        ${safeTitle}
      </h3>

      <!-- Card Description (Line Clamped) -->
      <p class="student-assignment-desc">
        ${safeDesc}
      </p>

      <!-- Card Deadline Row -->
      <div class="student-assignment-deadline-row ${deadlineInfo.isUrgent ? 'is-urgent' : ''} ${isExpired ? 'is-expired' : ''}">
        <span class="deadline-icon" aria-hidden="true">${deadlineInfo.icon}</span>
        <div class="deadline-info">
          <span class="deadline-label">${isExpired ? 'حالة الموعد:' : 'موعد التسليم:'}</span>
          <strong class="deadline-val">${escapeHtml(deadlineInfo.text.replace('موعد التسليم: ', ''))}</strong>
        </div>
      </div>

      <!-- Card Status Indicator -->
      <div class="student-assignment-status-row">
        ${statusChipHtml}
        ${
          assignment.fileUrl
            ? `<span class="assignment-has-attachment" title="يحتوي على ملف مرفق"><span aria-hidden="true">📎</span> مرفق متاح</span>`
            : ""
        }
      </div>

      <!-- Single Primary Action -->
      <div class="student-assignment-footer">
        <button
          type="button"
          class="student-assignment-btn ${isSubmitted ? 'is-submitted' : ''}"
          data-open-task-details="${escapeHtml(assignment.id)}"
          aria-label="فتح تفاصيل التاسك: ${safeTitle}"
        >
          <span>فتح التاسك</span>
          <span class="btn-arrow" aria-hidden="true">←</span>
        </button>
      </div>
    </article>
  `;
}

/**
 * Returns HTML string for student assignments skeleton grid.
 * @param {number} [count=3]
 * @returns {string}
 */
export function renderStudentAssignmentSkeletonGrid(count = 3) {
  const skeletonCard = `
    <div class="student-assignment-card is-skeleton" aria-hidden="true">
      <div class="d-flex justify-between mb-3">
        <div class="skeleton-shimmer" style="width:90px;height:24px;border-radius:12px;"></div>
        <div class="skeleton-shimmer" style="width:70px;height:20px;border-radius:6px;"></div>
      </div>
      <div class="skeleton-shimmer mb-2" style="width:85%;height:24px;border-radius:6px;"></div>
      <div class="skeleton-shimmer mb-1" style="width:100%;height:16px;border-radius:4px;"></div>
      <div class="skeleton-shimmer mb-4" style="width:65%;height:16px;border-radius:4px;"></div>
      <div class="skeleton-shimmer mb-3" style="width:100%;height:36px;border-radius:8px;"></div>
      <div class="skeleton-shimmer" style="width:100%;height:40px;border-radius:8px;"></div>
    </div>
  `;

  return `
    <div class="student-assignments-grid" aria-busy="true" aria-label="جاري تحميل التاسكات...">
      ${Array.from({ length: count }, () => skeletonCard).join("")}
    </div>
  `;
}

/**
 * Returns HTML string for teacher assignment card.
 * @param {object} options
 * @param {object} options.assignment
 * @returns {string}
 */
export function renderTeacherAssignmentCard({ assignment }) {
  const safeTitle = escapeHtml(assignment.title || "تاسك بدون عنوان");
  const rawDesc = (assignment.description || "").trim();
  const safeDesc = rawDesc ? escapeHtml(rawDesc) : "لا يوجد وصف مضاف.";
  const groupLabel = assignment.group === "ALL" ? "جميع المجموعات (ALL)" : (assignment.group || "عام");

  return `
    <div class="teacher-assignment-card" dir="rtl">
      <div class="d-flex items-center justify-between mb-2">
        <span class="badge badge-gold">${escapeHtml(groupLabel)}</span>
        <span class="text-xs text-muted">الديدلاين: <strong>${formatDate(assignment.deadline)}</strong></span>
      </div>
      <h4 class="font-bold mb-2" style="font-size:1.1rem;line-height:1.4;">${safeTitle}</h4>
      <p class="text-sm text-muted mb-3" style="line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
        ${safeDesc}
      </p>
      <div class="d-flex items-center justify-between w-full mt-3 pt-3" style="border-top:1px solid var(--color-border);">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          data-teacher-view-submissions="${escapeHtml(assignment.id)}"
          data-task-title="${safeTitle}"
        >
          <span>استعراض التسليمات والتقييم 📋</span>
        </button>
      </div>
    </div>
  `;
}
