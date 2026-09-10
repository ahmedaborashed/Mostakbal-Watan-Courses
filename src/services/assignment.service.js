// src/services/assignment.service.js
import { callApi } from "../repositories/api.client.js";
import { storage, auth } from "../core/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

export const AssignmentService = {
  /**
   * Uploads assignment solution file to Firebase Storage under the student's secure folder.
   */
  async uploadSubmissionFile(assignmentId, file) {
    const user = auth.currentUser;
    if (!user) throw new Error("يجب تسجيل الدخول لرفع الملفات.");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `submissions/${assignmentId}/${user.uid}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        studentUid: user.uid,
        assignmentId
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return {
      filePath,
      downloadUrl
    };
  },

  /**
   * Submits assignment answer and optional file.
   */
  async submitTask(assignmentId, answerText = "", file = null) {
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
  },

  /**
   * Teacher grades student assignment.
   */
  async gradeTask(assignmentId, studentUid, grade, feedback = "") {
    return await callApi("gradeAssignment", {
      assignmentId,
      studentUid,
      grade: Number(grade),
      feedback
    });
  }
};
