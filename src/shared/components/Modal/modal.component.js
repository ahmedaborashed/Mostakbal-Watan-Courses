// src/shared/components/Modal/modal.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent background scroll
    const firstInput = modal.querySelector("input, button:not(.modal-close), textarea, select");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 80);
    }
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Returns HTML string for a standardized Modal dialog.
 */
export function renderModal({
  id,
  title,
  bodyHtml,
  footerHtml = "",
  closeButton = true,
  maxWidth = "580px"
}) {
  const titleId = `${id}_title`;
  return `
    <div id="${escapeHtml(id)}" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(titleId)}" aria-hidden="true">
      <div class="modal-box" style="max-width:${escapeHtml(maxWidth)};">
        <div class="modal-header">
          <h3 id="${escapeHtml(titleId)}" class="modal-title">${title}</h3>
          ${closeButton ? `<button type="button" class="modal-close" data-modal-close="${escapeHtml(id)}" aria-label="إغلاق النافذة">&times;</button>` : ""}
        </div>
        <div class="modal-body">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
      </div>
    </div>
  `;
}

// Global delegated click listener for modal overlays and close buttons
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    // Click on overlay outside modal box
    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
      closeModal(e.target.id);
    }
    // Click on explicit close button
    const closeBtn = e.target.closest("[data-modal-close]");
    if (closeBtn) {
      const targetId = closeBtn.getAttribute("data-modal-close");
      closeModal(targetId);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModals = document.querySelectorAll(".modal-overlay.show");
      openModals.forEach((m) => closeModal(m.id));
    }
  });
}
