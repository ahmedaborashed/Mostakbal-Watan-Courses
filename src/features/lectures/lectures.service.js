// src/features/lectures/lectures.service.js
import { db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
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
import { normalizeError } from "../../core/errors.js";

export const LecturesService = {
  /**
   * Fetches all published video lectures.
   */
  async getAllLectures() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.VIDEOS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Records that a student watched a lecture.
   */
  async recordWatchLog(videoId, studentUid, studentPhone, studentName = "") {
    try {
      await addDoc(collection(db, COLLECTIONS.VIDEO_LOGS), {
        videoId,
        studentId: studentUid,
        studentPhone: String(studentPhone || ""),
        studentName: String(studentName || ""),
        watchedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not record video watch log:", err);
    }
  },

  /**
   * Fetches watched video IDs for a student to render badges.
   */
  async getStudentWatchedLogs(studentUid, studentPhone = "") {
    try {
      const q = query(
        collection(db, COLLECTIONS.VIDEO_LOGS),
        where("studentPhone", "==", String(studentPhone))
      );
      const snap = await getDocs(q);
      const watched = new Set();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.videoId) watched.add(data.videoId);
      });
      return watched;
    } catch (err) {
      console.warn("Failed to load student watch logs:", err);
      return new Set();
    }
  },

  /**
   * Teacher creates a new lecture video.
   */
  async createLecture({ name, videoId, url = "", group = "ALL" }) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.VIDEOS), {
        name: (name || "").trim(),
        videoId: (videoId || "").trim(),
        url: (url || "").trim(),
        group: group || "ALL",
        createdAt: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher updates existing lecture.
   */
  async updateLecture(lectureId, { name, videoId, group }) {
    try {
      await updateDoc(doc(db, COLLECTIONS.VIDEOS, lectureId), {
        ...(name ? { name: name.trim() } : {}),
        ...(videoId ? { videoId: videoId.trim() } : {}),
        ...(group ? { group } : {}),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher deletes a lecture.
   */
  async deleteLecture(lectureId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VIDEOS, lectureId));
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
