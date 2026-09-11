// src/features/assignments/components/assignment-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { formatDate, getDeadlineInfo, isDeadlinePassed } from "../../../shared/utils/date.utils.js";

/**
 * Intelligent content formatter for assignment titles and descriptions.
 * Handles legacy generic titles like 'task1', 'task2', 'Task3' and extracts
 * meaningful topics from descriptions.
 * @param {string} rawTitle
 * @param {string} rawDesc
 * @returns {{ title: string, desc: string }}
 */
export function formatAssignmentContent(rawTitle = "", rawDesc = "") {
  let title = (rawTitle || "").trim();
  let desc = (rawDesc || "").trim();

  // If title is generic (task1, task2, Task3, تاسك 1, etc.)
  if (!title || /^(task\s*\d+|تاسك\s*\d*)$/i.test(title)) {
    const taskNumMatch = title.match(/\d+/);
    const taskNum = taskNumMatch ? taskNumMatch[0] : "";

    if (/Student Grade Analyzer/i.test(desc) || /درجات الطلاب/i.test(desc)) {
      title = `تحليل درجات الطلاب ${taskNum ? `(تاسك ${taskNum})` : ''} - Grade Analyzer`;
    } else if (/آلة حاسبة/i.test(desc) || /حاسبة بسيطة/i.test(desc) || /calculator/i.test(desc)) {
      title = `برنامج آلة حاسبة بسيطة ${taskNum ? `(تاسك ${taskNum})` : ''} - Calculator`;
    } else if (/fruits/i.test(desc) || /قائمة|مصفوفة|List/i.test(desc)) {
      title = `التعامل مع القوائم والمصفوفات ${taskNum ? `(تاسك ${taskNum})` : ''} - Python Lists`;
    } else if (/loop|for|while|حلقات/i.test(desc)) {
      title = `تطبيق عملي على حلقات التكرار ${taskNum ? `(تاسك ${taskNum})` : ''} - Python Loops`;
    } else if (taskNum) {
      title = `تاسك تطبيقي عملي #${taskNum}`;
    } else {
      title = "تاسك تطبيقي عملي بالـ Python";
    }
  }

  // Clean description: strip repetitive prefixes like "🐍 Python Task — Student Grade Analyzer"
  desc = desc
    .replace(/^🐍\s*Python\s*Task\s*[-—–:]*\s*(Student Grade Analyzer|اعمل برنامج فيه:|اعمل برنامج)?\s*/i, "")
    .trim();

  return {
    title,
    desc: desc || "تطبيق عملي ومهام برمجية مطلوبة وفق توجيهات المعلم لمتابعة مستواك."
  };
}

/**
 * Normalizes group labels into short, neat badges.
 * @param {string} group
 * @returns {string}
 */
export function formatGroupLabel(group) {
  if (!group || group === "ALL") return "جميع المجموعات";
  if (group.includes("مجموعة الأحد والأربعاء")) {
    const timeMatch = group.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/);
    return timeMatch ? `الأحد والأربعاء (${timeMatch[0]})` : "مجموعة الأحد والأربعاء";
  }
  return group.length > 24 ? `${group.slice(0, 22)}...` : group;
}

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

  // 1. Format Title & Description with intelligent topic extraction
  const { title: displayTitle, desc: displayDesc } = formatAssignmentContent(
    assignment.title,
    assignment.description
  );
  const safeTitle = escapeHtml(displayTitle);
  const safeDesc = escapeHtml(displayDesc);
  const safeGroup = escapeHtml(formatGroupLabel(assignment.group));

  // 2. Status Badge Resolution
  let statusBadgeHtml;
  let deadlineTagHtml;

  if (isSubmitted) {
    const isGraded = submission.grade !== undefined && submission.grade !== null;
    if (isGraded) {
      statusBadgeHtml = `<span class="assignment-badge is-graded"><span class="badge-dot">●</span> تم التصحيح (${submission.grade}/100)</span>`;
      deadlineTagHtml = `<span class="deadline-strip-tag is-normal">تم تسليمه</span>`;
    } else {
      statusBadgeHtml = `<span class="assignment-badge is-submitted"><span class="badge-dot">●</span> تم التسليم بنجاح</span>`;
      deadlineTagHtml = `<span class="deadline-strip-tag is-normal">قيد التصحيح</span>`;
    }
  } else if (isExpired) {
    statusBadgeHtml = `<span class="assignment-badge is-expired"><span class="badge-dot">●</span> انتهى الموعد</span>`;
    deadlineTagHtml = `<span class="deadline-strip-tag is-expired">منتهي</span>`;
  } else if (deadlineInfo.isUrgent) {
    statusBadgeHtml = `<span class="assignment-badge is-urgent"><span class="badge-dot">●</span> ${escapeHtml(deadlineInfo.label)}</span>`;
    deadlineTagHtml = `<span class="deadline-strip-tag is-urgent">${escapeHtml(deadlineInfo.text.replace('موعد التسليم: ', ''))}</span>`;
  } else {
    statusBadgeHtml = `<span class="assignment-badge is-pending"><span class="badge-dot">●</span> مطلوب تسليمه</span>`;
    deadlineTagHtml = `<span class="deadline-strip-tag is-normal">متاح</span>`;
  }

  // 3. Deadline Text
  const deadlineDateStr = assignment.deadline ? formatDate(assignment.deadline) : "بدون موعد محدد";
  const deadlineValText = isExpired
    ? `انتهى في (${deadlineDateStr})`
    : (deadlineInfo.isUrgent ? deadlineInfo.text : deadlineDateStr);

  // 4. Action Button Label & Styling
  let buttonLabel = "فتح التاسك";
  let buttonClass = "";
  if (isSubmitted) {
    buttonLabel = "عرض حلك والتصحيح";
    buttonClass = "is-submitted";
  } else if (isExpired) {
    buttonLabel = "مراجعة تفاصيل التاسك";
    buttonClass = "is-expired";
  }

  // 5. Attachment Chip
  let attachmentBadgeHtml = "";
  if (assignment.fileUrl) {
    attachmentBadgeHtml = `
      <span class="assignment-badge is-attachment" title="يوجد ملف مرفق من المعلم">
        <span class="badge-icon" aria-hidden="true">📎</span>
        <span>مرفق متاح</span>
      </span>
    `;
  }

  return `
    <article class="student-assignment-card ${isSubmitted ? 'is-submitted' : ''} ${isExpired ? 'is-expired' : ''} ${deadlineInfo.isUrgent ? 'is-urgent' : ''}" dir="rtl">
      <div class="student-assignment-body">
        <!-- Card Header: Badges -->
        <div class="student-assignment-header">
          <div class="header-badges-right">
            <span class="assignment-badge is-group" title="${escapeHtml(assignment.group || 'عام')}">
              <span class="badge-icon" aria-hidden="true">👥</span>
              <span>${safeGroup}</span>
            </span>
            ${attachmentBadgeHtml}
          </div>
          ${statusBadgeHtml}
        </div>

        <!-- Card Title (Prominent, High-Contrast Cairo) -->
        <h3 class="student-assignment-title" title="${safeTitle}">
          ${safeTitle}
        </h3>

        <!-- Card Description (Line Clamped & Clean) -->
        <p class="student-assignment-desc">
          ${safeDesc}
        </p>

        <!-- Card Deadline Strip (Sleek, Modern, Integrated) -->
        <div class="student-assignment-deadline-strip ${deadlineInfo.isUrgent ? 'is-urgent' : ''} ${isExpired ? 'is-expired' : ''} ${isSubmitted ? 'is-submitted' : ''}">
          <div class="deadline-strip-main">
            <div class="deadline-strip-icon-box" aria-hidden="true">
              ${isExpired ? '⌛' : (deadlineInfo.isUrgent ? '⚡' : '⏰')}
            </div>
            <div class="deadline-strip-text">
              <span class="deadline-strip-label">${isExpired ? 'حالة الموعد' : 'موعد التسليم'}</span>
              <strong class="deadline-strip-val">${escapeHtml(deadlineValText)}</strong>
            </div>
          </div>
          ${deadlineTagHtml}
        </div>
      </div>

      <!-- Single Primary Action -->
      <div class="student-assignment-footer">
        <button
          type="button"
          class="student-assignment-btn ${buttonClass}"
          data-open-task-details="${escapeHtml(assignment.id)}"
          aria-label="${buttonLabel}: ${safeTitle}"
        >
          <span>${buttonLabel}</span>
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
        <div class="skeleton-shimmer" style="width:100px;height:24px;border-radius:12px;"></div>
        <div class="skeleton-shimmer" style="width:80px;height:24px;border-radius:12px;"></div>
      </div>
      <div class="skeleton-shimmer mb-2" style="width:85%;height:24px;border-radius:6px;"></div>
      <div class="skeleton-shimmer mb-1" style="width:100%;height:16px;border-radius:4px;"></div>
      <div class="skeleton-shimmer mb-4" style="width:70%;height:16px;border-radius:4px;"></div>
      <div class="skeleton-shimmer mb-3" style="width:100%;height:44px;border-radius:8px;"></div>
      <div class="skeleton-shimmer" style="width:100%;height:42px;border-radius:8px;"></div>
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
  const { title: displayTitle, desc: displayDesc } = formatAssignmentContent(
    assignment.title,
    assignment.description
  );
  const safeTitle = escapeHtml(displayTitle);
  const safeDesc = escapeHtml(displayDesc);
  const safeGroup = escapeHtml(formatGroupLabel(assignment.group));

  return `
    <div class="teacher-assignment-card" dir="rtl">
      <div class="d-flex items-center justify-between mb-2">
        <span class="badge badge-gold">${safeGroup}</span>
        <span class="text-xs text-muted">الديدلاين: <strong>${formatDate(assignment.deadline)}</strong></span>
      </div>
      <h4 class="font-bold mb-2" style="font-size:1.1rem;line-height:1.4;">${safeTitle}</h4>
      <p class="text-sm text-muted mb-3" style="line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
        ${safeDesc}
      </p>
      <div class="d-flex items-center justify-between w-full mt-3 pt-3" style="border-top:1px solid var(--border);">
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
