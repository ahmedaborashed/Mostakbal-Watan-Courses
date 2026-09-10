// src/shared/components/Input/input.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

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
  extraAttrs = ""
}) {
  const inputId = id || (name ? `inp_${name}` : "");
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(inputId)}">${escapeHtml(label)}</label>` : ""}
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
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

export function renderPasswordInput({
  id = "password",
  name = "password",
  label = "كلمة المرور",
  placeholder = "••••••••",
  required = false,
  error = "",
  extraAttrs = ""
}) {
  const toggleId = `${id}Toggle`;
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>` : ""}
      <div class="password-input-wrapper">
        <input
          class="form-input ${error ? "has-error" : ""}"
          type="password"
          id="${escapeHtml(id)}"
          name="${escapeHtml(name)}"
          placeholder="${escapeHtml(placeholder)}"
          ${required ? "required" : ""}
          ${extraAttrs}
        />
        <button
          type="button"
          id="${escapeHtml(toggleId)}"
          class="password-toggle-btn"
          title="إظهار / إخفاء كلمة المرور"
          data-toggle-target="${escapeHtml(id)}"
        >
          👁️
        </button>
      </div>
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

export function renderSelect({
  id = "",
  name = "",
  label = "",
  options = [], // [{ value: '', label: '' }] or string[]
  selected = "",
  required = false,
  disabled = false,
  error = "",
  extraAttrs = ""
}) {
  const selectId = id || (name ? `sel_${name}` : "");
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(selectId)}">${escapeHtml(label)}</label>` : ""}
      <select
        class="form-select"
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
  extraAttrs = ""
}) {
  const textId = id || (name ? `txt_${name}` : "");
  return `
    <div class="form-group">
      ${label ? `<label class="form-label" for="${escapeHtml(textId)}">${escapeHtml(label)}</label>` : ""}
      <textarea
        class="form-textarea"
        id="${escapeHtml(textId)}"
        name="${escapeHtml(name || textId)}"
        rows="${rows}"
        placeholder="${escapeHtml(placeholder)}"
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${extraAttrs}
      >${escapeHtml(value)}</textarea>
      ${error ? `<div class="form-error">⚠️ ${escapeHtml(error)}</div>` : ""}
    </div>
  `;
}

// Password toggle global event listener
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
