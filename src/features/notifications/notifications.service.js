// src/features/notifications/notifications.service.js
import { db } from "../../core/firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS, NOTIFICATION_TYPES } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export { NOTIFICATION_TYPES };

export const NotificationsService = {
  /**
   * Fetches notifications for a specific recipient user.
   * Supports backward-compatible query fallbacks if compound indexes are missing.
   * @param {string} userId
   * @param {number} [maxLimit=30]
   * @returns {Promise<Array>}
   */
  async getUserNotifications(userId, maxLimit = 30) {
    if (!userId) return [];

    try {
      const notifRef = collection(db, COLLECTIONS.NOTIFICATIONS);

      // Attempt ordered query
      let docs = [];
      try {
        const q = query(
          notifRef,
          where("recipientUid", "in", [userId, "all", "ALL"]),
          orderBy("createdAt", "desc"),
          limit(maxLimit)
        );
        const snap = await getDocs(q);
        docs = snap.docs;
      } catch (orderErr) {
        // Fallback without compound index
        const qFallback = query(
          notifRef,
          where("recipientUid", "in", [userId, "all", "ALL"]),
          limit(maxLimit * 2)
        );
        const snap = await getDocs(qFallback);
        docs = snap.docs;
      }

      const list = docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          recipientUid: data.recipientUid || userId,
          title: data.title || "إشعار جديد",
          body: data.body || "",
          type: data.type || NOTIFICATION_TYPES.ANNOUNCEMENT,
          deepLink: data.deepLink || null,
          metadata: data.metadata || {},
          read: Boolean(data.read),
          readAt: data.readAt || null,
          createdAt: data.createdAt || null
        };
      });

      // Sort in memory (newest first)
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      return list.slice(0, maxLimit);
    } catch (err) {
      console.warn("Error fetching user notifications:", err?.message || err);
      return [];
    }
  },

  /**
   * Marks a notification as read.
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    if (!notificationId) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Marks all unread notifications for a user as read.
   * @param {string} userId
   */
  async markAllAsRead(userId) {
    if (!userId) return;
    try {
      const items = await this.getUserNotifications(userId, 50);
      const unread = items.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), {
            read: true,
            readAt: serverTimestamp()
          }).catch(() => {})
        )
      );
      return { success: true, markedCount: unread.length };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Creates a notification record in Firestore.
   * @param {object} params
   * @param {string} params.recipientUid
   * @param {string} params.title
   * @param {string} params.body
   * @param {string} [params.type]
   * @param {string} [params.deepLink]
   * @param {object} [params.metadata]
   */
  async createNotification({ recipientUid, title, body, type = NOTIFICATION_TYPES.ANNOUNCEMENT, deepLink = null, metadata = {} }) {
    try {
      const ref = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        recipientUid,
        title: title.trim(),
        body: (body || "").trim(),
        type,
        deepLink,
        metadata,
        read: false,
        createdAt: serverTimestamp()
      });
      return { id: ref.id, success: true };
    } catch (err) {
      console.warn("Failed to create notification:", err?.message || err);
      return { success: false };
    }
  }
};
