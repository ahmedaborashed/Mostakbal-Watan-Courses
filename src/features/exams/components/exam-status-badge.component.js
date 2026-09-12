// src/features/exams/components/exam-status-badge.component.js
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { isDeadlinePassed } from "../../../shared/utils/date.utils.js";

/**
 * Computes the semantic status and returns metadata and rendered badge HTML.
 * @param {object} exam
 * @param {object} [result]
 * @returns {{ status: string, label: string, variant: string, icon: string, html: string }}
 */
export function getExamStatusInfo(exam, result = null) {
  if (!exam) {
    return {
      status: "unknown",
      label: "غير محدد",
      variant: "neutral",
      icon: "❓",
      html: renderBadge({ text: "غير محدد", variant: "neutral" })
    };
  }

  // 1. Check Result state
  const examResult = result || exam.result;
  if (examResult) {
    if (examResult.status === "pending_essay") {
      return {
        status: "pending_essay",
        label: "قيد التصحيح",
        variant: "warning",
        icon: "⏳",
        html: renderBadge({ text: "قيد التصحيح", variant: "warning", icon: "⏳" })
      };
    }
    return {
      status: "graded",
      label: "تم التصحيح",
      variant: "success",
      icon: "✓",
      html: renderBadge({ text: "تم التصحيح", variant: "success", icon: "✓" })
    };
  }

  // 2. Check Attempt state
  if (exam.attemptStatus === "submitted") {
    return {
      status: "submitted",
      label: "تم التسليم",
      variant: "info",
      icon: "✓",
      html: renderBadge({ text: "تم التسليم", variant: "info", icon: "✓" })
    };
  }

  if (exam.attemptStatus === "in_progress") {
    return {
      status: "in_progress",
      label: "متاح الآن",
      variant: "primary",
      icon: "●",
      html: renderBadge({ text: "متاح الآن", variant: "primary", icon: "●" })
    };
  }

  const isActive = exam.active !== false;

  // 3. Inactive or Draft
  if (!isActive) {
    return {
      status: "inactive",
      label: "معطل",
      variant: "danger",
      icon: "🔒",
      html: renderBadge({ text: "معطل", variant: "danger", icon: "🔒" })
    };
  }

  // 4. Expired by Deadline
  const deadline = exam.deadline || exam.endAt || exam.endDate;
  if (deadline && isDeadlinePassed(deadline)) {
    return {
      status: "expired",
      label: "منتهي",
      variant: "neutral",
      icon: "⌛",
      html: renderBadge({ text: "منتهي", variant: "neutral", icon: "⌛" })
    };
  }

  // 5. Upcoming by Start Date
  const startDate = exam.startDate || exam.startAt || exam.beginDate;
  if (startDate) {
    let startTimestamp = 0;
    if (typeof startDate?.toDate === "function") {
      startTimestamp = startDate.toDate().getTime();
    } else if (startDate instanceof Date) {
      startTimestamp = startDate.getTime();
    } else {
      startTimestamp = new Date(startDate).getTime();
    }

    if (!isNaN(startTimestamp) && startTimestamp > Date.now()) {
      return {
        status: "upcoming",
        label: "لم يبدأ",
        variant: "neutral",
        icon: "⏰",
        html: renderBadge({ text: "لم يبدأ", variant: "neutral", icon: "⏰" })
      };
    }
  }

  // 6. Available
  return {
    status: "available",
    label: "متاح الآن",
    variant: "success",
    icon: "●",
    html: renderBadge({ text: "متاح الآن", variant: "success", icon: "●" })
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
