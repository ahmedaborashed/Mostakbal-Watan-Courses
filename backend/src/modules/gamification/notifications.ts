import { db } from "../../config/firebase";
import { InAppNotification, NotificationType } from "./types";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Creates an in-app notification with built-in spam-protection and threshold filtering.
 */
export async function createNotification(payload: {
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  actionType: "ranking" | "competition" | "achievements" | "exam" | "adventure" | null;
  actionId: string | null;
  metadata?: Record<string, any>;
}): Promise<InAppNotification | null> {
  const { recipientUid, type, title, message, actionType, actionId, metadata } = payload;

  // Anti-spam guard: Check if an identical notification was recently generated (within last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const recentQuery = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("recipientUid", "==", recipientUid)
    .where("type", "==", type)
    .where("actionId", "==", actionId || "")
    .where("createdAt", ">=", thirtyMinutesAgo)
    .limit(1)
    .get();

  if (!recentQuery.empty) {
    // Avoid duplicate spam notifications
    return null;
  }

  const notificationDoc = db.collection(NOTIFICATIONS_COLLECTION).doc();
  const newNotification: InAppNotification = {
    id: notificationDoc.id,
    recipientUid,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    actionType,
    actionId: actionId || null,
    metadata: metadata || {}
  };

  await notificationDoc.set(newNotification);
  return newNotification;
}

/**
 * Creates a smart rank change notification only when meaningful progress thresholds are achieved.
 */
export async function checkAndNotifyRankChange(
  studentUid: string,
  newRank: number,
  previousRank: number,
  points: number
): Promise<void> {
  if (previousRank <= 0 || newRank <= 0 || newRank === previousRank) return;

  const positionsGained = previousRank - newRank;

  // Meaningful thresholds:
  // 1. Reached #1
  if (newRank === 1 && previousRank !== 1) {
    await createNotification({
      recipientUid: studentUid,
      type: "rank_up",
      title: "🥇 المركز الأول في المنصة!",
      message: `مبروك يا بطل! انتزعت المركز الأول بجدارة برصيد ${points.toLocaleString()} نقطة!`,
      actionType: "ranking",
      actionId: "global"
    });
    return;
  }

  // 2. Entered Top 10
  if (newRank <= 10 && previousRank > 10) {
    await createNotification({
      recipientUid: studentUid,
      type: "top_10_entry",
      title: "🔥 دخلت قائمة العشرة الأوائل!",
      message: `رائع جداً! أصبحت الآن في المركز #${newRank} ضمن أفضل 10 طلاب في المنصة.`,
      actionType: "ranking",
      actionId: "global"
    });
    return;
  }

  // 3. Significant leap (jumped >= 3 positions)
  if (positionsGained >= 3) {
    await createNotification({
      recipientUid: studentUid,
      type: "rank_up",
      title: "📈 تقدم ملحوظ في الترتيب!",
      message: `تقدمت ${positionsGained} مراكز للأمام وأصبح ترتيبك الآن #${newRank}. واصل التألق!`,
      actionType: "ranking",
      actionId: "global"
    });
    return;
  }

  // 4. Significant drop (dropped >= 5 positions)
  if (positionsGained <= -5) {
    await createNotification({
      recipientUid: studentUid,
      type: "rank_down",
      title: "تنبيه الترتيب ⚠️",
      message: `تراجع ترتيبك إلى #${newRank}. حل المزيد من التحديات والواجبات لتستعيد صدارتك!`,
      actionType: "ranking",
      actionId: "global"
    });
  }
}

/**
 * Fetches notifications for a student.
 */
export async function getStudentNotifications(
  studentUid: string,
  limitCount: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: InAppNotification[]; unreadCount: number }> {
  let query = db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("recipientUid", "==", studentUid);

  if (unreadOnly) {
    query = query.where("read", "==", false);
  }

  const snap = await query.orderBy("createdAt", "desc").limit(limitCount).get();
  const notifications: InAppNotification[] = snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }));

  // Calculate unread count
  const unreadSnap = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("recipientUid", "==", studentUid)
    .where("read", "==", false)
    .get();

  return {
    notifications,
    unreadCount: unreadSnap.size
  };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(studentUid: string, notificationId: string): Promise<boolean> {
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
  const snap = await docRef.get();

  if (!snap.exists) return false;
  const data = snap.data()!;
  if (data.recipientUid !== studentUid) return false;

  await docRef.update({ read: true });
  return true;
}

/**
 * Marks all notifications for a student as read.
 */
export async function markAllNotificationsAsRead(studentUid: string): Promise<number> {
  const snap = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("recipientUid", "==", studentUid)
    .where("read", "==", false)
    .get();

  if (snap.empty) return 0;

  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
  return snap.size;
}
