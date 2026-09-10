// src/shared/components/SearchBar/search-bar.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an accessible Search Bar input.
 * @param {object} options
 * @param {string} [options.id="searchInput"]
 * @param {string} [options.placeholder="بحث..."]
 * @param {string} [options.value=""]
 * @param {string} [options.className=""]
 */
export function renderSearchBar({
  id = "searchInput",
  placeholder = "بحث...",
  value = "",
  className = ""
} = {}) {
  return `
    <div class="search-bar-wrapper ${escapeHtml(className)}">
      <span class="search-bar-icon" aria-hidden="true">🔍</span>
      <input
        type="search"
        id="${escapeHtml(id)}"
        class="form-input search-bar-input"
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}"
        aria-label="${escapeHtml(placeholder)}"
      />
    </div>
  `;
}
