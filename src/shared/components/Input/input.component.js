// src/shared/components/Input/input.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Standard Text / Number / Tel Input
 */
export function renderInput({
  id = "",
  name = "",
  label = "",
  type = "text",
  value = "",
  placeholder = "",
  required = false,
  disabled = false,
  error = "",
  hint = "",
  className = "",
  extraAttrs = ""
} = {}) {
  const inputId = id || (name ? `inp_${name}` : "");
  return `
    <div class="form-group ${escapeHtml(className)}">
      ${label ? `<label class="form-label" for="${escapeHtml(inputId)}"><span>${escapeHtml(label)}</span>${required ? '<span class="text-danger">*</span>' : ''}</label>` : ""}
      <input
        class="form-input ${error ? "has-error" : ""}"
        type="${escapeHtml(type)}"
        id="${escapeHtml(inputId)}"
        name="${escapeHtml(name || inputId)}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}"
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${extraAttrs}
      />
      ${hint && !error ? `<div class="form-hint">${escapeHtml(hint)}</div>` : ""}
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

/**
 * Password Input with show/hide toggle
 */
export function renderPasswordInput({
  id = "password",
  name = "password",
  label = "كلمة المرور",
  placeholder = "••••••••",
  required = false,
  error = "",
  hint = "",
  extraAttrs = ""
} = {}) {
  const toggleId = `${id}Toggle`;
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span>${required ? '<span class="text-danger">*</span>' : ''}</label>` : ""}
      <div class="password-input-wrapper">
        <input
          class="form-input ${error ? "has-error" : ""}"
          type="password"
          id="${escapeHtml(id)}"
          name="${escapeHtml(name)}"
          placeholder="${escapeHtml(placeholder)}"
          autocomplete="current-password"
          ${required ? "required" : ""}
          ${extraAttrs}
        />
        <button
          type="button"
          id="${escapeHtml(toggleId)}"
          class="password-toggle-btn"
          aria-label="إظهار أو إخفاء كلمة المرور"
          title="إظهار / إخفاء كلمة المرور"
          data-toggle-target="${escapeHtml(id)}"
        >
          👁️
        </button>
      </div>
      ${hint && !error ? `<div class="form-hint">${escapeHtml(hint)}</div>` : ""}
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

/**
 * Select Dropdown Input
 */
export function renderSelect({
  id = "",
  name = "",
  label = "",
  options = [],
  selected = "",
  required = false,
  disabled = false,
  error = "",
  extraAttrs = ""
} = {}) {
  const selectId = id || (name ? `sel_${name}` : "");
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(selectId)}"><span>${escapeHtml(label)}</span>${required ? '<span class="text-danger">*</span>' : ''}</label>` : ""}
      <select
        class="form-select ${error ? "has-error" : ""}"
        id="${escapeHtml(selectId)}"
        name="${escapeHtml(name || selectId)}"
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${extraAttrs}
      >
        ${options
          .map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            const isSel = String(val) === String(selected) ? "selected" : "";
            return `<option value="${escapeHtml(val)}" ${isSel}>${escapeHtml(lbl)}</option>`;
          })
          .join("")}
      </select>
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

/**
 * Textarea Input
 */
export function renderTextarea({
  id = "",
  name = "",
  label = "",
  value = "",
  placeholder = "",
  rows = 3,
  required = false,
  disabled = false,
  error = "",
  hint = "",
  extraAttrs = ""
} = {}) {
  const textId = id || (name ? `txt_${name}` : "");
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(textId)}"><span>${escapeHtml(label)}</span>${required ? '<span class="text-danger">*</span>' : ''}</label>` : ""}
      <textarea
        class="form-textarea ${error ? "has-error" : ""}"
        id="${escapeHtml(textId)}"
        name="${escapeHtml(name || textId)}"
        rows="${rows}"
        placeholder="${escapeHtml(placeholder)}"
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${extraAttrs}
      >${escapeHtml(value)}</textarea>
      ${hint && !error ? `<div class="form-hint">${escapeHtml(hint)}</div>` : ""}
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

/**
 * Switch Toggle Control
 */
export function renderSwitch({
  id = "",
  name = "",
  label = "",
  checked = false,
  extraAttrs = ""
} = {}) {
  return `
    <label class="custom-control" for="${escapeHtml(id)}">
      <div class="custom-switch">
        <input type="checkbox" id="${escapeHtml(id)}" name="${escapeHtml(name || id)}" ${checked ? "checked" : ""} ${extraAttrs} />
        <span class="switch-slider"></span>
      </div>
      ${label ? `<span class="font-bold text-sm">${escapeHtml(label)}</span>` : ""}
    </label>
  `;
}

// Global delegated listener for password visibility toggling
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".password-toggle-btn");
    if (!btn) return;
    const targetId = btn.getAttribute("data-toggle-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "🙈" : "👁️";
  });
}
