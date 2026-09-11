// src/shared/utils/date.utils.js

/**
 * Formats date into Arabic friendly locale or ISO slice.
 * @param {Date|string|number|object} dateVal - Date object, Firestore timestamp, or string
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return "—";

  let dateObj;
  if (typeof dateVal?.toDate === "function") {
    dateObj = dateVal.toDate();
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else {
    dateObj = new Date(dateVal);
  }

  if (isNaN(dateObj.getTime())) return "—";

  return dateObj.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Formats duration seconds into mm:ss display (e.g. 15:00).
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTimer(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Parses deadline into a Date object.
 * If deadline is a YYYY-MM-DD string without time, treats it as end of day (23:59:59.999).
 * @param {string|Date|object} deadline
 * @returns {Date|null}
 */
export function parseDeadline(deadline) {
  if (!deadline) return null;
  if (typeof deadline?.toDate === "function") {
    return deadline.toDate();
  }
  if (deadline instanceof Date) {
    return isNaN(deadline.getTime()) ? null : deadline;
  }
  if (typeof deadline === "string") {
    const trimmed = deadline.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const eod = new Date(`${trimmed}T23:59:59.999`);
      return isNaN(eod.getTime()) ? new Date(trimmed) : eod;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(deadline);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Checks if a given deadline string or date has passed.
 * @param {string|Date|object} deadline
 * @returns {boolean}
 */
export function isDeadlinePassed(deadline) {
  const dateObj = parseDeadline(deadline);
  if (!dateObj) return false;
  return dateObj.getTime() < Date.now();
}

/**
 * Formats date and time into Arabic friendly string (e.g. 11 سبتمبر 2026 · 04:30 م).
 * @param {Date|string|number|object} dateVal
 * @returns {string}
 */
export function formatDateTime(dateVal) {
  if (!dateVal) return "—";

  let dateObj;
  if (typeof dateVal?.toDate === "function") {
    dateObj = dateVal.toDate();
  } else if (dateVal instanceof Date) {
    dateObj = dateVal;
  } else {
    dateObj = new Date(dateVal);
  }

  if (isNaN(dateObj.getTime())) return "—";

  const dateStr = dateObj.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const timeStr = dateObj.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${dateStr} · ${timeStr}`;
}

/**
 * Returns structured deadline info with remaining time, urgency, and Arabic labels.
 * @param {string|Date|object} deadline
 * @returns {object}
 */
export function getDeadlineInfo(deadline) {
  const dateObj = parseDeadline(deadline);
  if (!dateObj) {
    return {
      isExpired: false,
      isUrgent: false,
      text: "بدون موعد محدد",
      label: "بدون ديدلاين",
      variant: "muted",
      icon: "⏰",
      dateObj: null
    };
  }

  const now = Date.now();
  const diffMs = dateObj.getTime() - now;
  const formattedDate = formatDate(dateObj);

  if (diffMs <= 0) {
    return {
      isExpired: true,
      isUrgent: false,
      text: `انتهى موعد التسليم (${formattedDate})`,
      label: "انتهى الموعد",
      variant: "danger",
      icon: "🔴",
      dateObj
    };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (hoursRemaining < 24) {
    return {
      isExpired: false,
      isUrgent: true,
      text: hoursRemaining <= 1 ? "متبقي أقل من ساعة واحدة!" : `متبقي ${hoursRemaining} ساعة فقط!`,
      label: "أقل من يوم",
      variant: "warning",
      icon: "🟡",
      dateObj
    };
  }

  if (daysRemaining <= 2) {
    return {
      isExpired: false,
      isUrgent: true,
      text: daysRemaining === 1 ? "متبقي يوم واحد على التسليم" : "متبقي يومان على التسليم",
      label: daysRemaining === 1 ? "متبقي يوم" : "متبقي يومان",
      variant: "warning",
      icon: "🟡",
      dateObj
    };
  }

  return {
    isExpired: false,
    isUrgent: false,
    text: `موعد التسليم: ${formattedDate}`,
    label: formattedDate,
    variant: "secondary",
    icon: "⏰",
    dateObj
  };
}
