// src/features/lectures/components/resource-list.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns icon and descriptive Arabic label according to resource type.
 * @param {string} type
 * @returns {{ icon: string, label: string }}
 */
function getResourceMeta(type) {
  switch (type) {
    case "file":
      return { icon: "📄", label: "ملف تعليمي" };
    case "drive":
      return { icon: "📦", label: "Google Drive" };
    case "link":
    default:
      return { icon: "🔗", label: "رابط خارجي" };
  }
}

/**
 * Renders a single resource item card.
 * @param {object} resource
 * @param {string} resource.title
 * @param {string} resource.url
 * @param {string} [resource.type="link"]
 * @returns {string}
 */
export function renderResourceItem({ title, url, type = "link" }) {
  const meta = getResourceMeta(type);
  const safeTitle = escapeHtml(title || "مصدر بدون عنوان");
  const safeUrl = escapeHtml(url || "#");

  return `
    <a
      href="${safeUrl}"
      target="_blank"
      rel="noopener noreferrer"
      class="lesson-resource-card"
      aria-label="${safeTitle} (${meta.label}) - يفتح في نافذة جديدة"
    >
      <div class="lesson-resource-icon" aria-hidden="true">${meta.icon}</div>
      <div class="lesson-resource-info">
        <strong class="lesson-resource-title">${safeTitle}</strong>
        <span class="lesson-resource-type">${meta.label}</span>
      </div>
      <span class="lesson-resource-arrow" aria-hidden="true">↗</span>
    </a>
  `;
}

/**
 * Renders a complete list of resources or an informative empty state.
 * @param {Array<{ title: string, url: string, type: string }>} resources
 * @param {object} [options]
 * @param {string} [options.emptyText="لا توجد مصادر إضافية مرفقة بهذا الدرس."]
 * @returns {string}
 */
export function renderResourceList(resources = [], { emptyText = "لا توجد مصادر إضافية مرفقة بهذا الدرس." } = {}) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return `
      <div class="text-muted text-sm py-2" style="display:flex;align-items:center;gap:0.5rem;">
        <span aria-hidden="true">ℹ️</span>
        <span>${escapeHtml(emptyText)}</span>
      </div>
    `;
  }

  return `
    <div class="lesson-resource-list" role="list">
      ${resources.map((r) => renderResourceItem(r)).join("")}
    </div>
  `;
}
