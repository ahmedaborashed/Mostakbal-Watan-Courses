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
 * Checks if a given deadline string or date has passed.
 * @param {string|Date|object} deadline
 * @returns {boolean}
 */
export function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  let dateObj;
  if (typeof deadline?.toDate === "function") {
    dateObj = deadline.toDate();
  } else if (deadline instanceof Date) {
    dateObj = deadline;
  } else {
    dateObj = new Date(deadline);
  }
  return dateObj.getTime() < Date.now();
}
