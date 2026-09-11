// src/features/python-adventure/components/code-editor.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Renders the LTR Python Code Editor with line numbers and toolbar.
 */
export function renderCodeEditor({ initialCode = "" }) {
  const lineCount = Math.max(1, (initialCode.match(/\n/g) || []).length + 1);
  const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join("");

  return `
    <div class="py-editor-container" dir="ltr">
      <!-- Editor Top Toolbar -->
      <div class="py-editor-toolbar">
        <div class="d-flex items-center gap-2">
          <span class="py-lang-badge">🐍 Python 3</span>
          <span class="py-editor-hint text-xs text-muted">اضغط Tab لإضافة 4 مسافات • Ctrl+Enter للتشغيل</span>
        </div>
        <div class="d-flex items-center gap-2">
          <button type="button" class="py-toolbar-btn" id="pyCopyCodeBtn" title="نسخ الكود">
            <span>📋 نسخ</span>
          </button>
          <button type="button" class="py-toolbar-btn" id="pyResetCodeBtn" title="استعادة الكود الأصلي">
            <span>🔄 استعادة القالب</span>
          </button>
        </div>
      </div>

      <!-- Editor Main Work Area -->
      <div class="py-editor-body">
        <!-- Line Numbers Gutter -->
        <div class="py-line-numbers" id="pyLineNumbers" aria-hidden="true">
          ${lineNumbersHtml}
        </div>

        <!-- Textarea Code Input -->
        <textarea
          id="pyCodeTextarea"
          class="py-code-textarea"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          placeholder="# اكتب كود بايثون هنا..."
          aria-label="محرر كود بايثون"
        >${escapeHtml(initialCode)}</textarea>
      </div>
    </div>
  `;
}

/**
 * Attaches keyboard listeners and line number synchronization to the editor.
 */
export function wireCodeEditorEvents({ textareaEl, lineNumbersEl, onChange, onRunShortcut }) {
  if (!textareaEl || !lineNumbersEl) return;

  function updateLineNumbers() {
    const lines = textareaEl.value.split("\n").length;
    const currentCount = lineNumbersEl.children.length;
    if (lines !== currentCount) {
      lineNumbersEl.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join("");
    }
  }

  function syncScroll() {
    lineNumbersEl.scrollTop = textareaEl.scrollTop;
  }

  textareaEl.addEventListener("input", () => {
    updateLineNumbers();
    if (typeof onChange === "function") {
      onChange(textareaEl.value);
    }
  });

  textareaEl.addEventListener("scroll", syncScroll);

  textareaEl.addEventListener("keydown", (e) => {
    // Ctrl + Enter or Cmd + Enter = Run code
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (typeof onRunShortcut === "function") {
        onRunShortcut();
      }
      return;
    }

    // Tab key indent
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      const value = textareaEl.value;

      if (e.shiftKey) {
        // Shift + Tab: unindent 4 spaces
        const beforeCursor = value.substring(0, start);
        const lastNewLine = beforeCursor.lastIndexOf("\n");
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
        if (value.substring(lineStart, lineStart + 4) === "    ") {
          textareaEl.value = value.substring(0, lineStart) + value.substring(lineStart + 4);
          textareaEl.selectionStart = Math.max(lineStart, start - 4);
          textareaEl.selectionEnd = Math.max(lineStart, end - 4);
        }
      } else {
        // Tab: insert 4 spaces
        textareaEl.value = value.substring(0, start) + "    " + value.substring(end);
        textareaEl.selectionStart = textareaEl.selectionEnd = start + 4;
      }
      updateLineNumbers();
      if (typeof onChange === "function") {
        onChange(textareaEl.value);
      }
      return;
    }

    // Auto-indent on Enter
    if (e.key === "Enter") {
      const start = textareaEl.selectionStart;
      const value = textareaEl.value;
      const beforeCursor = value.substring(0, start);
      const currentLine = beforeCursor.split("\n").pop() || "";
      const matchIndent = currentLine.match(/^(\s*)/);
      let indent = matchIndent ? matchIndent[1] : "";

      // If line ends with colon :, add 4 more spaces
      if (currentLine.trim().endsWith(":")) {
        indent += "    ";
      }

      if (indent.length > 0) {
        e.preventDefault();
        const afterCursor = value.substring(textareaEl.selectionEnd);
        textareaEl.value = beforeCursor + "\n" + indent + afterCursor;
        textareaEl.selectionStart = textareaEl.selectionEnd = start + 1 + indent.length;
        updateLineNumbers();
        if (typeof onChange === "function") {
          onChange(textareaEl.value);
        }
      }
    }
  });

  updateLineNumbers();
}
