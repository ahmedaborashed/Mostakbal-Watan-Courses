// src/shared/utils/formatters.js

/**
 * Standardizes Egyptian phone format (removes spaces, leading +2, etc.).
 */
export function formatPhoneNumber(phone) {
  if (!phone) return "";
  return String(phone).replace(/\s+/g, "").replace(/^\+2/, "");
}

/**
 * Formats score into string with percentage.
 */
export function formatGrade(score, total) {
  if (score === null || score === undefined) return "قيد التصحيح ⏳";
  const numScore = Number(score);
  const numTotal = Number(total) || 100;
  const pct = Math.round((numScore / numTotal) * 100);
  return `${numScore} / ${numTotal} (${pct}%)`;
}

/**
 * Formats file size in readable KB or MB.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
