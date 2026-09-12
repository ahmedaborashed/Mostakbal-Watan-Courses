// src/features/notifications/notifications.controller.js
import { NotificationsService } from "./notifications.service.js";
import {
  renderNotificationsModal,
  renderNotificationsList,
  renderNotificationBellButton,
  NOTIFICATIONS_MODAL_ID
} from "./components/notifications-modal.component.js";
import { mountStudentInteractiveBanner } from "./components/student-interactive-banner.component.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";
import { auth } from "../../core/firebase.js";

export const NotificationsController = {
  _notifications: [],
  _onNavigateCallback: null,

  /**
   * Initializes the notifications system, mounts modal shell, and mounts bell widget.
   * @param {object} options
   * @param {string|HTMLElement} [options.bellMountPoint]
   * @param {function} [options.onNavigate]
   */
  async init({ bellMountPoint = null, onNavigate = null } = {}) {
    this._onNavigateCallback = onNavigate;

    // Ensure modal shell in DOM
    if (!document.getElementById(NOTIFICATIONS_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderNotificationsModal());
      this.bindModalGlobalEvents();
    }

    // Mount bell if mount point specified
    if (bellMountPoint) {
      const mountEl = typeof bellMountPoint === "string" ? document.getElementById(bellMountPoint) : bellMountPoint;
      if (mountEl) {
        mountEl.innerHTML = renderNotificationBellButton(0);
        mountEl.querySelector("#openNotificationsModalBtn")?.addEventListener("click", () => {
          this.openNotificationsModal();
        });
      }
    }

    // Refresh unread count
    await this.refreshUnreadBadge();
  },

  /**
   * Fetches latest notifications and updates the bell badge counter.
   */
  async refreshUnreadBadge() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      this._notifications = await NotificationsService.getUserNotifications(user.uid, 20);
      const unreadCount = this._notifications.filter((n) => !n.read).length;

      const badgeEl = document.getElementById("notificationsUnreadBadge");
      const btnEl = document.getElementById("openNotificationsModalBtn");

      if (badgeEl) {
        if (unreadCount > 0) {
          badgeEl.textContent = unreadCount > 9 ? "9+" : unreadCount;
          badgeEl.style.display = "flex";
        } else {
          badgeEl.style.display = "none";
        }
      } else if (btnEl && unreadCount > 0) {
        btnEl.insertAdjacentHTML(
          "beforeend",
          `<span class="badge badge-danger position-absolute" id="notificationsUnreadBadge" style="top:2px;inset-inline-end:2px;min-width:18px;height:18px;border-radius:10px;font-size:0.65rem;padding:0 4px;font-weight:900;display:flex;align-items:center;justify-content:center;">${unreadCount > 9 ? "9+" : unreadCount}</span>`
        );
      }
    } catch (e) {
      console.warn("Refresh unread badge error:", e);
    }
  },

  /**
   * Opens the notifications modal and loads fresh notifications.
   */
  async openNotificationsModal() {
    openModal(NOTIFICATIONS_MODAL_ID);
    const bodySlot = document.getElementById("notificationsListBodySlot");
    if (!bodySlot) return;

    setHtml(bodySlot, `<div class="p-4 text-center"><div class="spinner"></div><div class="text-xs text-muted mt-2">جاري جلب الإشعارات... ⏳</div></div>`);

    const user = auth.currentUser;
    if (!user) {
      setHtml(bodySlot, `<div class="p-4 text-center text-muted">يرجى تسجيل الدخول لعرض الإشعارات.</div>`);
      return;
    }

    try {
      this._notifications = await NotificationsService.getUserNotifications(user.uid, 30);
      this.renderList();
    } catch (err) {
      setHtml(bodySlot, `<div class="p-4 text-center text-danger text-sm">تعذر جلب قائمة الإشعارات.</div>`);
    }
  },

  /**
   * Renders the notification cards and binds deep links and read toggles.
   */
  renderList() {
    const bodySlot = document.getElementById("notificationsListBodySlot");
    if (!bodySlot) return;

    setHtml(bodySlot, renderNotificationsList(this._notifications));

    // Bind individual mark as read
    bodySlot.querySelectorAll("[data-notif-mark-read]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-notif-mark-read");
        try {
          await NotificationsService.markAsRead(id);
          const item = this._notifications.find((n) => n.id === id);
          if (item) item.read = true;
          this.renderList();
          this.refreshUnreadBadge();
        } catch (e) {
          showToast("تعذر تحديث حالة الإشعار", "error");
        }
      });
    });

    // Bind deep links
    bodySlot.querySelectorAll("[data-notif-deep-link]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const link = btn.getAttribute("data-notif-deep-link");
        const id = btn.getAttribute("data-notification-id");

        // Mark as read on navigation
        if (id) {
          NotificationsService.markAsRead(id).catch(() => {});
          const item = this._notifications.find((n) => n.id === id);
          if (item) item.read = true;
          this.refreshUnreadBadge();
        }

        closeModal(NOTIFICATIONS_MODAL_ID);

        if (typeof this._onNavigateCallback === "function") {
          this._onNavigateCallback(link);
        } else {
          // Fallback tab navigation
          const tabBtn = document.querySelector(`[data-tab="${link}"]`);
          if (tabBtn) tabBtn.click();
        }
      });
    });
  },

  /**
   * Binds global events for the notifications modal.
   */
  bindModalGlobalEvents() {
    document.getElementById("markAllNotificationsReadBtn")?.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await NotificationsService.markAllAsRead(user.uid);
        this._notifications.forEach((n) => (n.read = true));
        this.renderList();
        this.refreshUnreadBadge();
        showToast("تم تحديد جميع الإشعارات كمقروءة ✓", "success");
      } catch (err) {
        showToast("تعذر تحديث حالة الإشعارات", "error");
      }
    });
  },

  /**
   * Mounts the interactive notification banner for students (Python Valley Challenge, Lectures, Tasks).
   * @param {string|HTMLElement} containerId
   * @param {object} options
   * @param {object} options.student
   * @param {function} options.onNavigate
   */
  mountStudentInteractiveBanner(containerId, { student = {}, onNavigate = null } = {}) {
    return mountStudentInteractiveBanner(containerId, {
      student,
      onNavigate: onNavigate || this._onNavigateCallback
    });
  }
};
