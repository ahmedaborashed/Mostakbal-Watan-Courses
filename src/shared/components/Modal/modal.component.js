// src/shared/components/Modal/modal.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
  }
}

/**
 * Returns HTML string for a standardized Modal dialog.
 */
export function renderModal({ id, title, bodyHtml, footerHtml = "", closeButton = true }) {
  return `
    <div id="${escapeHtml(id)}" class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          ${closeButton ? `<button type="button" class="modal-close" data-modal-close="${escapeHtml(id)}">&times;</button>` : ""}
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
    // Click outside modal box
    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("show");
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
      openModals.forEach((m) => m.classList.remove("show"));
    }
  });
}
