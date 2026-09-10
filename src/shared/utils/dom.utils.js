// src/shared/utils/dom.utils.js

/**
 * Escapes HTML to prevent XSS injection in dynamic innerHTML.
 * @param {any} val
 * @returns {string}
 */
export function escapeHtml(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Safe querySelector shorthand.
 */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Safe querySelectorAll shorthand returning Array.
 */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Helper to attach event listener with auto-cleanup capability.
 */
export function on(element, event, handler, options = {}) {
  if (!element) return () => {};
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Sets innerHTML safely after converting or passing string.
 */
export function setHtml(element, htmlString) {
  if (typeof element === "string") {
    element = qs(element);
  }
  if (element) {
    element.innerHTML = htmlString;
  }
}
