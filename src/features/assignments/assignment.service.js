// src/features/assignments/assignment.service.js
import { callApi } from "../../repositories/api.client.js";
import { storage, auth, db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { COLLECTIONS, STORAGE_PATHS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const AssignmentService = {
  /**
   * Fetches all assignments.
   */
  async getAllAssignments() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches submissions for a given student across known assignments.
   * Prioritizes canonical auth.currentUser.uid and checks target subcollections as well as legacy docs.
   * @param {string} [studentUid]
   * @param {Array<string>} [assignmentIds=[]] - Optional list of assignment IDs to perform O(1) checks
   * @returns {Promise<Map<string, object>>}
   */
  async getStudentSubmissions(studentUid, assignmentIds = []) {
    const map = new Map();
    const canonicalUid = auth.currentUser?.uid || studentUid;
    if (!canonicalUid) return map;

    // 1. Direct O(1) checks for known assignment IDs (subcollection + legacy doc)
    if (Array.isArray(assignmentIds) && assignmentIds.length > 0) {
      await Promise.all(
        assignmentIds.map(async (aId) => {
          try {
            // Target subcollection: /assignments/{aId}/submissions/{canonicalUid}
            const subRef = doc(db, COLLECTIONS.ASSIGNMENTS, aId, COLLECTIONS.SUBMISSIONS, canonicalUid);
            const subSnap = await getDoc(subRef);
            if (subSnap.exists()) {
              map.set(aId, { id: subSnap.id, ...subSnap.data() });
              return;
            }

            // Legacy doc: /submissions/{canonicalUid}_{aId}
            const legRef = doc(db, COLLECTIONS.SUBMISSIONS, `${canonicalUid}_${aId}`);
            const legSnap = await getDoc(legRef);
            if (legSnap.exists()) {
              map.set(aId, { id: legSnap.id, ...legSnap.data() });
            }
          } catch (err) {
            // Ignore single lookup failure and continue
          }
        })
      );
    }

    // 2. Query fallback on legacy /submissions collection where studentId == canonicalUid
    try {
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where("studentId", "==", canonicalUid)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.assignmentId && !map.has(data.assignmentId)) {
          map.set(data.assignmentId, { id: d.id, ...data });
        }
      });
    } catch (err) {
      console.warn("Could not load submissions via query fallback:", err);
    }

    return map;
  },

  /**
   * Uploads solution file directly to secure Firebase Storage path.
   * Validates size, non-empty assignmentId, and normalizes code file MIME types.
   */
  async uploadSubmissionFile(assignmentId, file) {
    const user = auth.currentUser;
    if (!user) throw new Error("يجب تسجيل الدخول لرفع الملفات.");
    if (!assignmentId) throw new Error("معرف الواجب مفقود، تعذر رفع الملف.");
    if (!file) throw new Error("لم يتم اختيار أي ملف للرفع.");

    // Enforce 20MB limit
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("حجم الملف يتجاوز الحد المسموح به (20 ميجابايت).");
    }

    // Normalize MIME type based on file extension if file.type is empty/generic
    let contentType = file.type;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!contentType || contentType === "application/octet-stream") {
      const mimeMap = {
        py: "text/x-python",
        txt: "text/plain",
        pdf: "application/pdf",
        zip: "application/zip",
        rar: "application/x-zip-compressed",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      };
      contentType = mimeMap[ext] || "text/plain";
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${STORAGE_PATHS.SUBMISSIONS}/${assignmentId}/${user.uid}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, filePath);

    try {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType,
        customMetadata: {
          studentUid: user.uid,
          assignmentId,
          originalFileName: file.name
        }
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { filePath, downloadUrl, fileName: file.name, fileSize: file.size };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Submits assignment solution and file through Cloud Function.
   */
  async submitTask(assignmentId, answerText = "", file = null) {
    if (!assignmentId) {
      throw new Error("معرف الواجب غير محدد.");
    }
    const cleanText = (answerText || "").trim();
    if (!cleanText && !file) {
      throw new Error("يجب كتابة نص الإجابة أو إرفاق ملف للحل.");
    }

    try {
      let fileUrl = "";
      if (file) {
        const uploadRes = await this.uploadSubmissionFile(assignmentId, file);
        fileUrl = uploadRes.downloadUrl;
      }

      return await callApi("submitAssignment", {
        assignmentId,
        answerText: cleanText,
        fileUrl
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches all submissions for an assignment (Teacher / Admin).
   * Queries both subcollection and legacy collection.
   */
  async getTaskSubmissions(assignmentId) {
    if (!assignmentId) return [];
    try {
      const submissionsMap = new Map();

      // 1. Check target subcollection: /assignments/{id}/submissions
      try {
        const subSnap = await getDocs(
          collection(db, COLLECTIONS.ASSIGNMENTS, assignmentId, COLLECTIONS.SUBMISSIONS)
        );
        subSnap.docs.forEach((d) => {
          submissionsMap.set(d.id, { id: d.id, ...d.data() });
        });
      } catch (subErr) {
        console.warn("Subcollection submissions fetch warning:", subErr);
      }

      // 2. Check legacy top-level collection: /submissions where assignmentId == assignmentId
      try {
        const q = query(
          collection(db, COLLECTIONS.SUBMISSIONS),
          where("assignmentId", "==", assignmentId)
        );
        const legSnap = await getDocs(q);
        legSnap.docs.forEach((d) => {
          const data = d.data();
          const uid = data.studentUid || data.studentId || d.id.split("_")[0];
          if (!submissionsMap.has(uid)) {
            submissionsMap.set(uid, { id: d.id, ...data });
          }
        });
      } catch (legErr) {
        console.warn("Legacy submissions fetch warning:", legErr);
      }

      return Array.from(submissionsMap.values()).sort((a, b) => {
        const timeA = a.submittedAt?.toDate?.() || new Date(a.submittedAt || a.createdAt || 0);
        const timeB = b.submittedAt?.toDate?.() || new Date(b.submittedAt || b.createdAt || 0);
        return timeB - timeA;
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher grades student assignment.
   */
  async gradeTask(assignmentId, studentUid, grade, feedback = "") {
    try {
      return await callApi("gradeAssignment", {
        assignmentId,
        studentUid,
        grade: Number(grade),
        feedback
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher creates new assignment.
   */
  async createAssignment({ title, description, deadline, group = "ALL", fileUrl = "" }) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ASSIGNMENTS), {
        title: (title || "").trim(),
        description: (description || "").trim(),
        deadline: deadline || "",
        group: group || "ALL",
        fileUrl: fileUrl || "",
        createdAt: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
