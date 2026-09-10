// src/shared/components/FileUpload/file-upload.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a Drag & Drop File Upload Zone.
 * @param {object} options
 * @param {string} [options.id="fileUploadZone"]
 * @param {string} [options.inputId="fileUploadInput"]
 * @param {string} [options.label="اسحب وأفلت الملف هنا"]
 * @param {string} [options.sublabel="أو اضغط لتصفح الملفات من جهازك"]
 * @param {string} [options.accept=".pdf,.zip,.rar,.png,.jpg,.jpeg,.py,.txt,.docx,.doc"]
 * @param {string} [options.hint="الحد الأقصى للملف: 20 ميجابايت"]
 */
export function renderFileUploadZone({
  id = "fileUploadZone",
  inputId = "fileUploadInput",
  label = "اسحب وأفلت ملف الحل هنا",
  sublabel = "أو اضغط لاختيار ملف من جهازك",
  accept = ".pdf,.zip,.rar,.png,.jpg,.jpeg,.py,.txt,.docx,.doc",
  hint = "الحد الأقصى للملف: 20 ميجابايت"
} = {}) {
  return `
    <div class="form-group">
      <div id="${escapeHtml(id)}" class="file-upload-zone" tabindex="0" role="button" aria-label="${escapeHtml(label)}">
        <input
          type="file"
          id="${escapeHtml(inputId)}"
          class="d-none"
          accept="${escapeHtml(accept)}"
        />
        <div class="file-upload-icon" aria-hidden="true">📁</div>
        <div class="file-upload-text">${escapeHtml(label)}</div>
        <div class="file-upload-subtext">${escapeHtml(sublabel)}</div>
        <div id="${escapeHtml(id)}_preview" class="mt-2 text-xs font-bold text-accent"></div>
      </div>
      ${hint ? `<span class="text-xs text-muted mt-1 d-block">${escapeHtml(hint)}</span>` : ""}
    </div>
  `;
}

/**
 * Binds drag and drop and file change listeners to a FileUploadZone.
 */
export function bindFileUploadZone(zoneId, inputId, onFileSelected) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(`${zoneId}_preview`);
  if (!zone || !input) return;

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove("is-dragover");
    });
  });

  zone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      input.files = dt.files;
      handleFile(dt.files[0]);
    }
  });

  input.addEventListener("change", () => {
    if (input.files && input.files.length > 0) {
      handleFile(input.files[0]);
    }
  });

  function handleFile(file) {
    if (preview) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      preview.textContent = `📎 تم اختيار: ${file.name} (${sizeMb} MB)`;
    }
    if (typeof onFileSelected === "function") {
      onFileSelected(file);
    }
  }
}
