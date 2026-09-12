// src/features/lectures/lectures.service.js
import { db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError, NotFoundError } from "../../core/errors.js";
import { formatDate, formatDateTime } from "../../shared/utils/date.utils.js";
import { extractYouTubeId } from "../../shared/validators/url.validator.js";

/**
 * Normalizes Firestore video document into a standardized Lesson/Session entity
 * with full backward-compatibility for legacy records.
 * @param {string} id
 * @param {object} data
 * @returns {object}
 */
export function normalizeLecture(id, data = {}) {
  const legacyName = (data.name || "").trim();
  const modernTitle = (data.title || "").trim();
  const resolvedTitle = modernTitle || legacyName || "محاضرة بدون عنوان";

  let videoUrl = (data.videoUrl || data.url || "").trim();
  let videoId = (data.videoId || "").trim();

  // If videoUrl is missing but legacy videoId exists, synthesize standard URL
  if (!videoUrl && videoId) {
    videoUrl = videoId.startsWith("http") ? videoId : `https://www.youtube.com/watch?v=${videoId}`;
  }
  // If videoId is missing but videoUrl is YouTube, extract it
  if (!videoId && videoUrl) {
    videoId = extractYouTubeId(videoUrl) || "";
  }

  const group = (data.group || "ALL").trim();
  const groups = Array.isArray(data.groups) && data.groups.length > 0
    ? data.groups
    : (group ? [group] : ["ALL"]);

  // Normalize sessionDate
  let sessionDate = (data.sessionDate || "").trim();
  if (!sessionDate && data.createdAt) {
    sessionDate = formatDate(data.createdAt);
  }

  // Normalize resources list
  let resources = [];
  if (Array.isArray(data.resources)) {
    resources = data.resources
      .filter((r) => r && (r.title || r.url))
      .map((r) => ({
        title: (r.title || "مصدر إضافي").trim(),
        url: (r.url || "").trim(),
        type: (r.type || "link").trim() // "file" | "drive" | "link"
      }));
  }

  return {
    id,
    title: resolvedTitle,
    name: resolvedTitle, // Legacy alias
    description: (data.description || "").trim(),
    group,
    groups,
    sessionDate,
    videoUrl,
    videoId,
    fileUrl: (data.fileUrl || "").trim(),
    fileName: (data.fileName || (data.fileUrl ? "ملف المحاضرة الرئيسي" : "")).trim(),
    resources,
    active: data.active !== false, // default true
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    createdBy: data.createdBy || ""
  };
}

export const LecturesService = {
  /**
   * Fetches all published video lectures and normalizes them.
   */
  async getAllLectures() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.VIDEOS));
      return snap.docs.map((d) => normalizeLecture(d.id, d.data()));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches a single lecture by ID.
   */
  async getLectureById(lectureId) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.VIDEOS, lectureId));
      if (!docSnap.exists()) {
        throw new NotFoundError("المحاضرة المطلوبة غير موجودة أو تم حذفها.");
      }
      return normalizeLecture(docSnap.id, docSnap.data());
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Records that a student watched a lecture / video.
   */
  async recordWatchLog(videoIdOrLectureId, studentUid, studentPhone, studentName = "") {
    if (!videoIdOrLectureId) return;
    try {
      await addDoc(collection(db, COLLECTIONS.VIDEO_LOGS), {
        videoId: String(videoIdOrLectureId),
        lectureId: String(videoIdOrLectureId),
        studentId: String(studentUid || ""),
        studentPhone: String(studentPhone || ""),
        studentName: String(studentName || ""),
        watchedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not record video watch log:", err);
    }
  },

  /**
   * Fetches watched video IDs for a student to render badges and progress.
   */
  async getStudentWatchedLogs(studentUid, studentPhone = "") {
    const watched = new Set();
    try {
      // 1. Primary lookup by student phone
      if (studentPhone) {
        const qPhone = query(
          collection(db, COLLECTIONS.VIDEO_LOGS),
          where("studentPhone", "==", String(studentPhone))
        );
        const snapPhone = await getDocs(qPhone);
        snapPhone.docs.forEach((d) => {
          const data = d.data();
          if (data.videoId) watched.add(data.videoId);
          if (data.lectureId) watched.add(data.lectureId);
        });
      }

      // 2. Fallback / supplementary lookup by studentId if available
      if (studentUid && watched.size === 0) {
        const qUid = query(
          collection(db, COLLECTIONS.VIDEO_LOGS),
          where("studentId", "==", String(studentUid))
        );
        const snapUid = await getDocs(qUid);
        snapUid.docs.forEach((d) => {
          const data = d.data();
          if (data.videoId) watched.add(data.videoId);
          if (data.lectureId) watched.add(data.lectureId);
        });
      }

      return watched;
    } catch (err) {
      console.warn("Failed to load student watch logs:", err);
      return watched;
    }
  },

  /**
   * Staff creates a new comprehensive lesson / session.
   */
  async createLecture({
    title,
    name,
    description = "",
    group = "ALL",
    groups = null,
    sessionDate = "",
    videoUrl = "",
    fileUrl = "",
    fileName = "",
    resources = [],
    active = true,
    createdBy = ""
  }) {
    try {
      const resolvedTitle = (title || name || "").trim();
      const resolvedGroup = (group || "ALL").trim();
      const resolvedGroups = Array.isArray(groups) && groups.length > 0 ? groups : [resolvedGroup];
      const resolvedVideoUrl = (videoUrl || "").trim();
      const resolvedVideoId = extractYouTubeId(resolvedVideoUrl) || "";

      const payload = {
        title: resolvedTitle,
        name: resolvedTitle, // Legacy backward compatibility
        description: (description || "").trim(),
        group: resolvedGroup,
        groups: resolvedGroups,
        sessionDate: (sessionDate || "").trim(),
        videoUrl: resolvedVideoUrl,
        videoId: resolvedVideoId,
        url: resolvedVideoUrl, // Legacy alias
        fileUrl: (fileUrl || "").trim(),
        fileName: (fileName || "").trim(),
        resources: Array.isArray(resources) ? resources : [],
        active: active !== false,
        createdBy: String(createdBy || ""),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.VIDEOS), payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Staff updates existing lesson / session.
   */
  async updateLecture(lectureId, data = {}) {
    try {
      const updatePayload = {
        updatedAt: serverTimestamp()
      };

      if (data.title !== undefined || data.name !== undefined) {
        const t = (data.title || data.name || "").trim();
        updatePayload.title = t;
        updatePayload.name = t; // Backward compatibility
      }
      if (data.description !== undefined) {
        updatePayload.description = (data.description || "").trim();
      }
      if (data.group !== undefined) {
        updatePayload.group = (data.group || "ALL").trim();
        updatePayload.groups = Array.isArray(data.groups) && data.groups.length > 0
          ? data.groups
          : [updatePayload.group];
      }
      if (data.sessionDate !== undefined) {
        updatePayload.sessionDate = (data.sessionDate || "").trim();
      }
      if (data.videoUrl !== undefined) {
        const vUrl = (data.videoUrl || "").trim();
        updatePayload.videoUrl = vUrl;
        updatePayload.url = vUrl; // Legacy alias
        updatePayload.videoId = extractYouTubeId(vUrl) || "";
      }
      if (data.fileUrl !== undefined) {
        updatePayload.fileUrl = (data.fileUrl || "").trim();
      }
      if (data.fileName !== undefined) {
        updatePayload.fileName = (data.fileName || "").trim();
      }
      if (data.resources !== undefined) {
        updatePayload.resources = Array.isArray(data.resources) ? data.resources : [];
      }
      if (data.active !== undefined) {
        updatePayload.active = Boolean(data.active);
      }

      await updateDoc(doc(db, COLLECTIONS.VIDEOS, lectureId), updatePayload);
      return { id: lectureId, ...updatePayload };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Staff toggles lesson active/inactive status.
   */
  async toggleLectureStatus(lectureId, currentActive) {
    try {
      const nextActive = !currentActive;
      await updateDoc(doc(db, COLLECTIONS.VIDEOS, lectureId), {
        active: nextActive,
        updatedAt: serverTimestamp()
      });
      return nextActive;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Staff deletes a lecture.
   */
  async deleteLecture(lectureId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VIDEOS, lectureId));
      return true;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches comprehensive student engagement breakdown for a lecture.
   * Compares eligible students in lesson group against actual video_logs.
   *
   * @param {string} lectureId
   * @param {string} [group="ALL"]
   * @param {string} [videoId=""]
   * @returns {Promise<{
   *   totalCount: number,
   *   watchedCount: number,
   *   unwatchedCount: number,
   *   watchPercentage: number,
   *   watchedList: Array<object>,
   *   unwatchedList: Array<object>
   * }>}
   */
  async getLessonEngagement(lectureId, group = "ALL", videoId = "") {
    try {
      // 1. Fetch students for the target group
      const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      const allStudents = studentsSnap.docs.map((d) => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));

      const eligibleStudents = allStudents.filter((s) => {
        const sGroup = s.studentGroup || s.group || "ALL";
        if (group === "ALL" || sGroup === "ALL") return true;
        return sGroup === group;
      });

      // 2. Fetch watch logs for this lecture/video
      const logsMap = new Map(); // key: studentUid or phone -> log info

      const candidateIds = new Set([String(lectureId)]);
      if (videoId && videoId !== lectureId) {
        candidateIds.add(String(videoId));
      }

      for (const id of candidateIds) {
        try {
          const qLog = query(
            collection(db, COLLECTIONS.VIDEO_LOGS),
            where("lectureId", "==", id)
          );
          const snapLog = await getDocs(qLog);
          snapLog.docs.forEach((d) => {
            const data = d.data();
            const studentKey = data.studentId || data.studentPhone;
            if (studentKey) {
              const existing = logsMap.get(studentKey);
              const watchedAtDate = data.watchedAt?.toDate ? data.watchedAt.toDate() : new Date(data.watchedAt || 0);
              if (!existing) {
                logsMap.set(studentKey, {
                  firstOpened: watchedAtDate,
                  lastOpened: watchedAtDate,
                  watchCount: 1,
                  watchedAt: watchedAtDate
                });
              } else {
                existing.watchCount++;
                if (watchedAtDate > existing.lastOpened) existing.lastOpened = watchedAtDate;
                if (watchedAtDate < existing.firstOpened) existing.firstOpened = watchedAtDate;
              }
            }
          });
        } catch (_) {}

        try {
          const qVid = query(
            collection(db, COLLECTIONS.VIDEO_LOGS),
            where("videoId", "==", id)
          );
          const snapVid = await getDocs(qVid);
          snapVid.docs.forEach((d) => {
            const data = d.data();
            const studentKey = data.studentId || data.studentPhone;
            if (studentKey && !logsMap.has(studentKey)) {
              const watchedAtDate = data.watchedAt?.toDate ? data.watchedAt.toDate() : new Date(data.watchedAt || 0);
              logsMap.set(studentKey, {
                firstOpened: watchedAtDate,
                lastOpened: watchedAtDate,
                watchCount: 1,
                watchedAt: watchedAtDate
              });
            }
          });
        } catch (_) {}
      }

      // 3. Partition eligible students into watched and unwatched
      const watchedList = [];
      const unwatchedList = [];

      eligibleStudents.forEach((student) => {
        const uid = student.id || student.firestoreId;
        const phone = student.studentPhone || student.phone || "";
        const name = student.studentName || student.name || "طالب مسجل";
        const studentGroup = student.studentGroup || student.group || "ALL";

        const log = (uid && logsMap.get(uid)) || (phone && logsMap.get(phone));

        if (log) {
          watchedList.push({
            studentUid: uid,
            studentName: name,
            studentPhone: phone,
            group: studentGroup,
            watched: true,
            watchCount: log.watchCount,
            firstOpenedFormatted: formatDateTime(log.firstOpened),
            lastOpenedFormatted: formatDateTime(log.lastOpened),
            watchedAtFormatted: formatDateTime(log.watchedAt)
          });
        } else {
          unwatchedList.push({
            studentUid: uid,
            studentName: name,
            studentPhone: phone,
            group: studentGroup,
            watched: false
          });
        }
      });

      // Sort watched by latest first, unwatched alphabetically
      watchedList.sort((a, b) => (b.lastOpened?.getTime?.() || 0) - (a.lastOpened?.getTime?.() || 0));
      unwatchedList.sort((a, b) => a.studentName.localeCompare(b.studentName, "ar"));

      const totalCount = eligibleStudents.length;
      const watchedCount = watchedList.length;
      const unwatchedCount = unwatchedList.length;
      const watchPercentage = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

      return {
        totalCount,
        watchedCount,
        unwatchedCount,
        watchPercentage,
        watchedList,
        unwatchedList
      };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
