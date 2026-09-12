// src/features/notifications/components/notifications-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";
import { NOTIFICATION_TYPES } from "../../../core/constants.js";

export const NOTIFICATIONS_MODAL_ID = "appNotificationsModal";

/**
 * Returns HTML string for the Notification Bell Button to mount in Navbars.
 * @param {number} [unreadCount=0]
 * @returns {string}
 */
export function renderNotificationBellButton(unreadCount = 0) {
  const hasUnread = unreadCount > 0;
  return `
    <button
      type="button"
      id="openNotificationsModalBtn"
      class="btn btn-ghost btn-sm position-relative d-inline-flex items-center justify-center"
      style="padding:0.45rem;border-radius:var(--radius-full);width:38px;height:38px;"
      aria-label="عرض الإشعارات (${unreadCount} إشعار غير مقروء)"
      title="الإشعارات"
    >
      <span style="font-size:1.25rem;" aria-hidden="true">🔔</span>
      ${
        hasUnread
          ? `<span
              class="badge badge-danger position-absolute"
              id="notificationsUnreadBadge"
              style="top:2px;inset-inline-end:2px;min-width:18px;height:18px;border-radius:10px;font-size:0.65rem;padding:0 4px;font-weight:900;display:flex;align-items:center;justify-content:center;"
            >
              ${unreadCount > 9 ? "9+" : unreadCount}
            </span>`
          : ""
      }
    </button>
  `;
}

/**
 * Returns HTML string for the Notifications Modal shell.
 */
export function renderNotificationsModal() {
  return renderModal({
    id: NOTIFICATIONS_MODAL_ID,
    title: `
      <div class="d-flex items-center justify-between w-full pe-4">
        <div class="d-flex items-center gap-2">
          <span style="font-size:1.3rem;" aria-hidden="true">🔔</span>
          <span class="font-extrabold" style="font-size:1.15rem;">مركز الإشعارات والتنبيهات</span>
        </div>
        <button
          type="button"
          id="markAllNotificationsReadBtn"
          class="btn btn-ghost btn-xs text-primary font-bold"
          style="font-size:0.8rem;"
        >
          تحديد الكل كمقروء ✓
        </button>
      </div>
    `,
    bodyHtml: `<div id="notificationsListBodySlot" class="p-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-end w-full">
        <button type="button" class="btn btn-secondary btn-sm" data-modal-close="${NOTIFICATIONS_MODAL_ID}">
          إغلاق
        </button>
      </div>
    `,
    maxWidth: "540px"
  });
}

/**
 * Returns HTML for the inner list of notifications.
 * @param {Array} notifications
 * @returns {string}
 */
export function renderNotificationsList(notifications = []) {
  if (notifications.length === 0) {
    return `
      <div class="p-6 text-center text-muted">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;" aria-hidden="true">📭</div>
        <strong class="d-block font-extrabold text-sm mb-1" style="color:var(--color-text-primary);">لا توجد أي إشعارات جديدة</strong>
        <span class="text-xs">ستظهر هنا أحدث التنبيهات الخاصة بالامتحانات والواجبات والحضور.</span>
      </div>
    `;
  }

  const getTypeMeta = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.EXAM_AVAILABLE:
        return { icon: "📝", label: "امتحان جديد", badgeClass: "badge-gold" };
      case NOTIFICATION_TYPES.EXAM_RESULT:
        return { icon: "🎓", label: "نتيجة امتحان", badgeClass: "badge-success" };
      case NOTIFICATION_TYPES.ASSIGNMENT_NEW:
        return { icon: "📚", label: "تاسك جديد", badgeClass: "badge-gold" };
      case NOTIFICATION_TYPES.ASSIGNMENT_GRADED:
        return { icon: "✏️", label: "تقييم الواجب", badgeClass: "badge-info" };
      case NOTIFICATION_TYPES.ATTENDANCE_RECORDED:
        return { icon: "✅", label: "تسجيل حضور", badgeClass: "badge-success" };
      case NOTIFICATION_TYPES.ATTENDANCE_WARNING:
        return { icon: "🔴", label: "إنذار غياب", badgeClass: "badge-danger" };
      case NOTIFICATION_TYPES.RANKING_UPDATE:
        return { icon: "🏆", label: "لوحة الشرف", badgeClass: "badge-accent" };
      case NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED:
        return { icon: "🏅", label: "إنجاز جديد", badgeClass: "badge-gold" };
      case NOTIFICATION_TYPES.GAME_LEVEL_UP:
        return { icon: "🐍", label: "ترقية المستوى", badgeClass: "badge-accent" };
      default:
        return { icon: "🔔", label: "تنبيه عام", badgeClass: "badge-neutral" };
    }
  };

  return `
    <div class="d-flex flex-col gap-2" dir="rtl">
      ${notifications
        .map((notif) => {
          const isUnread = !notif.read;
          const meta = getTypeMeta(notif.type);
          const dateStr = notif.createdAt ? formatDate(notif.createdAt) : "اليوم";

          return `
            <div
              class="card p-3 position-relative ${isUnread ? 'is-unread' : ''}"
              style="background:${isUnread ? 'var(--color-bg-secondary)' : 'var(--color-surface-elevated)'};border:1px solid ${isUnread ? 'var(--color-primary)' : 'var(--color-border-subtle)'};border-radius:var(--radius-sm);transition:all 0.2s;"
              data-notification-id="${escapeHtml(notif.id)}"
              data-notification-unread="${isUnread}"
            >
              <div class="d-flex items-start justify-between gap-2 mb-1">
                <div class="d-flex items-center gap-2">
                  <span style="font-size:1.2rem;" aria-hidden="true">${meta.icon}</span>
                  <span class="badge ${meta.badgeClass} text-xs font-bold">${meta.label}</span>
                  ${isUnread ? `<span class="badge badge-primary text-xs" style="font-size:0.65rem;">جديد</span>` : ""}
                </div>
                <span class="text-xs text-muted font-mono" style="font-size:0.75rem;">${dateStr}</span>
              </div>

              <h4 class="font-extrabold text-sm m-0 mb-1" style="color:var(--color-text-primary);">
                ${escapeHtml(notif.title)}
              </h4>
              <p class="text-xs text-muted mb-2" style="line-height:1.5;">
                ${escapeHtml(notif.body || notif.message || "")}
              </p>

              <div class="d-flex items-center justify-between flex-wrap gap-2 pt-1" style="border-top:1px solid var(--color-border-subtle);">
                ${
                  (notif.deepLink || notif.link)
                    ? `
                  <button
                    type="button"
                    class="btn btn-link btn-xs p-0 text-primary font-bold"
                    data-notif-deep-link="${escapeHtml(notif.deepLink || notif.link)}"
                    data-notification-id="${escapeHtml(notif.id)}"
                  >
                    الانتقال للمعاينة ↗
                  </button>
                `
                    : `<span></span>`
                }

                ${
                  isUnread
                    ? `
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-muted"
                    style="font-size:0.75rem;"
                    data-notif-mark-read="${escapeHtml(notif.id)}"
                  >
                    تحديد كمقروء ✓
                  </button>
                `
                    : `<span class="text-xs text-muted" style="font-size:0.75rem;">تمت القراءة ✓</span>`
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}
