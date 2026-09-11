// src/features/exams/components/exam-status-badge.component.js
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { isDeadlinePassed } from "../../../shared/utils/date.utils.js";

/**
 * Computes the semantic status and returns metadata and rendered badge HTML.
 * @param {object} exam
 * @returns {{ status: string, label: string, variant: string, icon: string, html: string }}
 */
export function getExamStatusInfo(exam) {
  if (!exam) {
    return {
      status: "unknown",
      label: "غير محدد",
      variant: "neutral",
      icon: "❓",
      html: renderBadge({ text: "غير محدد", variant: "neutral" })
    };
  }

  const isActive = exam.active !== false;
  const questionsCount = Array.isArray(exam.questions) ? exam.questions.length : 0;

  // 1. Inactive or Draft
  if (!isActive) {
    if (questionsCount === 0 || exam.isDraft) {
      return {
        status: "draft",
        label: "مسودة",
        variant: "neutral",
        icon: "📝",
        html: renderBadge({ text: "مسودة", variant: "neutral", icon: "📝" })
      };
    }
    return {
      status: "inactive",
      label: "معطل",
      variant: "danger",
      icon: "🔒",
      html: renderBadge({ text: "معطل", variant: "danger", icon: "🔒" })
    };
  }

  // 2. Expired by Deadline
  if (exam.deadline && isDeadlinePassed(exam.deadline)) {
    return {
      status: "expired",
      label: "منتهي",
      variant: "warning",
      icon: "⌛",
      html: renderBadge({ text: "منتهي", variant: "warning", icon: "⌛" })
    };
  }

  // 3. Upcoming by Start Date
  if (exam.startDate) {
    let startTimestamp = 0;
    if (typeof exam.startDate?.toDate === "function") {
      startTimestamp = exam.startDate.toDate().getTime();
    } else if (exam.startDate instanceof Date) {
      startTimestamp = exam.startDate.getTime();
    } else {
      startTimestamp = new Date(exam.startDate).getTime();
    }

    if (!isNaN(startTimestamp) && startTimestamp > Date.now()) {
      return {
        status: "upcoming",
        label: "قريباً",
        variant: "info",
        icon: "⏰",
        html: renderBadge({ text: "قريباً", variant: "info", icon: "⏰" })
      };
    }
  }

  // 4. Active
  return {
    status: "active",
    label: "نشط",
    variant: "success",
    icon: "✓",
    html: renderBadge({ text: "نشط", variant: "success", icon: "✓" })
  };
}

/**
 * Returns HTML string of the semantic status badge for an exam.
 * @param {object} exam
 * @returns {string}
 */
export function renderExamStatusBadge(exam) {
  return getExamStatusInfo(exam).html;
}
