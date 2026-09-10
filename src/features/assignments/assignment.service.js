// src/features/assignments/assignment.service.js
import { callApi } from "../../repositories/api.client.js";
import { storage, auth, db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
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
   * Fetches submissions for a given student.
   */
  async getStudentSubmissions(studentUid, studentPhone = "") {
    try {
      // Query both auth UID and phone
      const q = query(
        collection(db, COLLECTIONS.SUBMISSIONS),
        where("studentId", "==", String(studentUid || studentPhone))
      );
      const snap = await getDocs(q);
      const map = new Map();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.assignmentId) {
          map.set(data.assignmentId, { id: d.id, ...data });
        }
      });
      return map;
    } catch (err) {
      console.warn("Could not load submissions:", err);
      return new Map();
    }
  },

  /**
   * Uploads solution file directly to secure Firebase Storage path.
   */
  async uploadSubmissionFile(assignmentId, file) {
    const user = auth.currentUser;
    if (!user) throw new Error("يجب تسجيل الدخول لرفع الملفات.");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${STORAGE_PATHS.SUBMISSIONS}/${assignmentId}/${user.uid}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, filePath);

    try {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          studentUid: user.uid,
          assignmentId
        }
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { filePath, downloadUrl };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Submits assignment solution and file through Cloud Function.
   */
  async submitTask(assignmentId, answerText = "", file = null) {
    try {
      let fileUrl = "";
      if (file) {
        const uploadRes = await this.uploadSubmissionFile(assignmentId, file);
        fileUrl = uploadRes.downloadUrl;
      }

      return await callApi("submitAssignment", {
        assignmentId,
        answerText,
        fileUrl
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
