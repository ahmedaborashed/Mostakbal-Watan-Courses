// src/components/toast.js

/**
 * Toast Notification Component
 */
let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
  }
}

export function showToast(message, type = "info", duration = 3000) {
  ensureContainer();

  const item = document.createElement("div");
  item.className = "toast-item";
  
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  item.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(item);

  // Trigger animation
  requestAnimationFrame(() => {
    item.classList.add("show");
  });

  setTimeout(() => {
    item.classList.remove("show");
    setTimeout(() => item.remove(), 300);
  }, duration);
}

// Attach to window for legacy callers
window.showToast = showToast;
