// src/shared/components/ConfirmDialog/confirm-dialog.component.js
import { renderModal, openModal, closeModal } from "../Modal/modal.component.js";
import { renderButton } from "../Button/button.component.js";
import { escapeHtml } from "../../utils/dom.utils.js";

const CONFIRM_MODAL_ID = "globalConfirmDialog";

function ensureConfirmDialog() {
  let modalEl = document.getElementById(CONFIRM_MODAL_ID);
  if (!modalEl) {
    const html = renderModal({
      id: CONFIRM_MODAL_ID,
      title: "تأكيد الإجراء",
      bodyHtml: `
        <div class="text-center py-2">
          <div id="confirmDialogIcon" style="font-size:3rem;margin-bottom:0.75rem;">⚠️</div>
          <p id="confirmDialogMessage" style="font-size:1rem;color:var(--color-text-secondary);line-height:1.6;"></p>
        </div>
      `,
      footerHtml: `
        <div class="d-flex gap-2 w-full justify-end">
          <button type="button" id="confirmDialogCancelBtn" class="btn btn-secondary">إلغاء</button>
          <button type="button" id="confirmDialogConfirmBtn" class="btn btn-danger">تأكيد</button>
        </div>
      `,
      maxWidth: "460px"
    });
    document.body.insertAdjacentHTML("beforeend", html);
  }
}

/**
 * Displays an asynchronous confirm modal dialog and returns a Promise resolving to true/false.
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} options.message
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @param {"danger"|"primary"|"warning"} [options.variant]
 * @param {string} [options.icon]
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog({
  title = "تأكيد العملية",
  message = "هل أنت متأكد من رغبتك في المتابعة؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "danger",
  icon = "⚠️"
} = {}) {
  ensureConfirmDialog();

  const titleEl = document.getElementById(`${CONFIRM_MODAL_ID}_title`);
  const iconEl = document.getElementById("confirmDialogIcon");
  const msgEl = document.getElementById("confirmDialogMessage");
  const confirmBtn = document.getElementById("confirmDialogConfirmBtn");
  const cancelBtn = document.getElementById("confirmDialogCancelBtn");

  if (titleEl) titleEl.textContent = title;
  if (iconEl) iconEl.textContent = icon;
  if (msgEl) msgEl.textContent = message;

  if (confirmBtn) {
    confirmBtn.className = `btn btn-${variant}`;
    confirmBtn.textContent = confirmText;
  }
  if (cancelBtn) {
    cancelBtn.textContent = cancelText;
  }

  openModal(CONFIRM_MODAL_ID);

  return new Promise((resolve) => {
    const handleConfirm = () => {
      cleanup();
      closeModal(CONFIRM_MODAL_ID);
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      closeModal(CONFIRM_MODAL_ID);
      resolve(false);
    };

    function cleanup() {
      confirmBtn?.removeEventListener("click", handleConfirm);
      cancelBtn?.removeEventListener("click", handleCancel);
    }

    confirmBtn?.addEventListener("click", handleConfirm, { once: true });
    cancelBtn?.addEventListener("click", handleCancel, { once: true });
  });
}
