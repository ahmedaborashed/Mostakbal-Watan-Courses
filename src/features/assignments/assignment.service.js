// src/features/assignments/assignment.service.js
import { callApi } from "../../repositories/api.client.js";
import { storage, auth, db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { COLLECTIONS, STORAGE_PATHS, FEATURES } from "../../core/constants.js";
import { normalizeError, isCloudFunctionUnavailable } from "../../core/errors.js";
import { StudentsService } from "../students/students.service.js";

/**
 * Normalizes any raw assignment grade to a 10-point scale.
 * Handles both 100-point scale legacy grades and already-normalized 10-point grades.
 * e.g., 80 -> 8, 95 -> 9.5, 72 -> 7.2, 8 -> 8, 9.5 -> 9.5, 0 -> 0.
 * @param {number|string|null|undefined} rawGrade
 * @param {number} [maxScore=100]
 * @returns {number|null}
 */
export function normalizeAssignmentGrade(rawGrade, maxScore = 100) {
  if (rawGrade === undefined || rawGrade === null || rawGrade === "") {
    return null;
  }
  const num = Number(rawGrade);
  if (isNaN(num)) return null;

  let scaledScore = num;
  if (num > 10) {
    const baseMax = maxScore > 10 ? maxScore : 100;
    scaledScore = (num / baseMax) * 10;
  }
  // Round to at most 1 decimal place
  return Math.round(scaledScore * 10) / 10;
}

/**
 * Returns formatted string representing the grade out of 10.
 * @param {number|string|null|undefined} rawGrade
 * @param {number} [maxScore=100]
 * @returns {string} e.g. "8 / 10" or "—"
 */
export function formatAssignmentGradeDisplay(rawGrade, maxScore = 100) {
  const norm = normalizeAssignmentGrade(rawGrade, maxScore);
  if (norm === null) return "—";
  return `${norm} / 10`;
}

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
  /**
   * Submits assignment solution and file through Cloud Function with direct Firestore fallback.
   */
  async submitTask(assignmentId, answerText = "", file = null) {
    if (!assignmentId) {
      throw new Error("معرف الواجب غير محدد.");
    }
    const cleanText = (answerText || "").trim();
    if (!cleanText && !file) {
      throw new Error("يجب كتابة نص الإجابة أو إرفاق ملف للحل قبل الإرسال.");
    }

    let fileUrl = "";
    if (file) {
      const uploadRes = await this.uploadSubmissionFile(assignmentId, file);
      fileUrl = uploadRes.downloadUrl;
    }

    // 1. Try Authoritative Cloud Function (only if enabled)
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        const apiResult = await callApi("submitAssignment", {
          assignmentId,
          answerText: cleanText,
          fileUrl
        });
        if (apiResult) {
          return {
            ...apiResult,
            fileUrl: apiResult.fileUrl || fileUrl
          };
        }
      } catch (apiErr) {
        console.warn("Cloud function submitAssignment unavailable, switching to direct Firestore fallback:", apiErr?.message || apiErr);
      }
    }

    // 2. Resilient Direct Firestore Submission Fallback
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً لتسليم الواجب.");
      }

      const studentUid = user.uid;

      // Check deadline if present in Firestore
      try {
        const assignmentSnap = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
        if (assignmentSnap.exists()) {
          const assignmentData = assignmentSnap.data();
          if (assignmentData.deadline) {
            let deadlineTime;
            if (assignmentData.deadline.toDate) {
              deadlineTime = assignmentData.deadline.toDate().getTime();
            } else if (assignmentData.deadline instanceof Date) {
              deadlineTime = assignmentData.deadline.getTime();
            } else if (typeof assignmentData.deadline === "string") {
              const trimmed = assignmentData.deadline.trim();
              if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                const eod = new Date(`${trimmed}T23:59:59.999`);
                deadlineTime = isNaN(eod.getTime()) ? new Date(trimmed).getTime() : eod.getTime();
              } else {
                deadlineTime = new Date(trimmed).getTime();
              }
            } else {
              deadlineTime = new Date(assignmentData.deadline).getTime();
            }

            if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
              throw new Error("انتهى الموعد المحدد لتسليم هذا الواجب.");
            }
          }
        }
      } catch (deadlineErr) {
        if (deadlineErr.message?.includes("انتهى الموعد")) throw deadlineErr;
      }

      // Fetch student profile data
      let studentData = {};
      try {
        const studentSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, studentUid));
        if (studentSnap.exists()) studentData = studentSnap.data();
      } catch (_) {}

      const studentName = studentData.name || user.displayName || "طالب مسجل";
      const studentPhone = studentData.studentPhone || studentData.phone || user.email?.replace("@student.local", "") || "";
      const group = studentData.group || "ALL";

      const submissionPayload = {
        assignmentId,
        studentUid,
        studentId: studentUid,
        studentName,
        studentPhone,
        group,
        answerText: cleanText,
        fileUrl,
        grade: null,
        feedback: null,
        submittedAt: serverTimestamp()
      };

      // Write to target subcollection: /assignments/{id}/submissions/{studentUid}
      await setDoc(
        doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId, COLLECTIONS.SUBMISSIONS, studentUid),
        submissionPayload,
        { merge: true }
      );

      // Also write to legacy top-level collection: /submissions/{studentUid}_{assignmentId}
      const legacyDocId = `${studentUid}_${assignmentId}`;
      await setDoc(doc(db, COLLECTIONS.SUBMISSIONS, legacyDocId), submissionPayload, { merge: true });

      return {
        success: true,
        message: "تم تسليم الواجب بنجاح ✅",
        fileUrl
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
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
   * Teacher grades student assignment with resilient direct Firestore fallback.
   */
  async gradeTask(assignmentId, studentUid, grade, feedback = "") {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("gradeAssignment", {
          assignmentId,
          studentUid,
          grade: Number(grade),
          feedback
        });
      } catch (apiErr) {
        console.warn("Cloud function gradeAssignment unavailable, executing direct Firestore fallback:", apiErr?.message || apiErr);
      }
    }

    try {
      const user = auth.currentUser;
      const gradingUpdate = {
        grade: Number(grade),
        feedback: (feedback || "").trim(),
        gradedBy: user?.uid || "teacher",
        gradedAt: serverTimestamp()
      };

      // 1. Update subcollection
      const subDocRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId, COLLECTIONS.SUBMISSIONS, studentUid);
      await setDoc(subDocRef, gradingUpdate, { merge: true });

      // 2. Update legacy doc
      const legacyDocId = `${studentUid}_${assignmentId}`;
      await setDoc(doc(db, COLLECTIONS.SUBMISSIONS, legacyDocId), gradingUpdate, { merge: true });

      return {
        success: true,
        message: "تم حفظ تقييم الواجب بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
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
  },

  /**
   * Deletes an assignment by ID.
   */
  async deleteAssignment(assignmentId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
      return true;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches the assignment, its target audience students, and joins with submissions.
   * Clearly separates students who submitted and students who did not.
   * @param {string} assignmentId
   * @returns {Promise<{
   *   assignment: object,
   *   totalEligible: number,
   *   submittedCount: number,
   *   notSubmittedCount: number,
   *   gradedCount: number,
   *   pendingCount: number,
   *   roster: Array<object>
   * }>}
   */
  async getAssignmentSubmissionsWithRoster(assignmentId) {
    if (!assignmentId) throw new Error("معرف الواجب مطلوب.");

    try {
      // 1. Fetch assignment
      let assignment = null;
      const snap = await getDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId));
      if (snap.exists()) {
        assignment = { id: snap.id, ...snap.data() };
      } else {
        throw new Error("الواجب المطلوب غير موجود.");
      }

      // 2. Fetch all registered students & submissions in parallel
      const [allStudents, submissions] = await Promise.all([
        StudentsService.getAllStudents(),
        this.getTaskSubmissions(assignmentId)
      ]);

      // 3. Map submissions by student identifiers for O(1) lookup
      const subMap = new Map();
      submissions.forEach((sub) => {
        const uid = sub.studentUid || sub.studentId || sub.id;
        if (uid) subMap.set(String(uid), sub);
        if (sub.studentPhone) subMap.set(String(sub.studentPhone).trim(), sub);
        if (sub.phone) subMap.set(String(sub.phone).trim(), sub);
      });

      // 4. Determine eligible students based on assignment audience
      const targetGroup = assignment.group || "ALL";
      const targetStudentIds = Array.isArray(assignment.targetStudentIds)
        ? assignment.targetStudentIds
        : (Array.isArray(assignment.selectedStudents) ? assignment.selectedStudents : null);

      let eligibleStudents = allStudents;
      if (targetStudentIds && targetStudentIds.length > 0) {
        const idSet = new Set(targetStudentIds.map(String));
        eligibleStudents = allStudents.filter(
          (s) => idSet.has(String(s.id)) || idSet.has(String(s.firestoreId)) || idSet.has(String(s.studentPhone))
        );
      } else if (targetGroup && targetGroup !== "ALL") {
        eligibleStudents = allStudents.filter((s) => {
          const sGrp = (s.group || s.studentGroup || "").trim();
          return sGrp === targetGroup.trim();
        });
      }

      // 5. LEFT JOIN: match each eligible student to their submission
      const roster = eligibleStudents.map((student) => {
        const sId = String(student.id || student.firestoreId || "");
        const sPhone = String(student.studentPhone || student.phone || "").trim();
        const submission = subMap.get(sId) || (sPhone ? subMap.get(sPhone) : null) || null;

        const studentName = (student.name || student.studentName || "طالب مسجل").trim();
        const studentGroup = (student.group || student.studentGroup || targetGroup || "عام").trim();

        if (submission) {
          const isGraded = submission.grade !== undefined && submission.grade !== null;
          const normalizedGrade = normalizeAssignmentGrade(submission.grade);
          const answer = (
            submission.answerText ||
            submission.answer ||
            submission.code ||
            submission.solution ||
            submission.content ||
            submission.text ||
            ""
          ).trim();

          return {
            studentUid: sId,
            studentName,
            studentPhone: sPhone,
            group: studentGroup,
            hasSubmitted: true,
            status: isGraded ? "graded" : "submitted",
            statusLabel: isGraded ? "تم التصحيح" : "تم التسليم (قيد التصحيح)",
            rawGrade: submission.grade,
            grade: normalizedGrade,
            gradeDisplay: isGraded ? `${normalizedGrade} / 10` : "قيد التصحيح",
            feedback: submission.feedback || "",
            answerText: answer,
            fileUrl: submission.fileUrl || "",
            submittedAt: submission.submittedAt || submission.createdAt || null,
            submissionId: submission.id,
            submission
          };
        } else {
          return {
            studentUid: sId,
            studentName,
            studentPhone: sPhone,
            group: studentGroup,
            hasSubmitted: false,
            status: "not_submitted",
            statusLabel: "لم يتم التسليم",
            rawGrade: null,
            grade: null,
            gradeDisplay: "—",
            feedback: "",
            answerText: "",
            fileUrl: "",
            submittedAt: null,
            submissionId: null,
            submission: null
          };
        }
      });

      // Also include any submissions whose student wasn't in eligibleStudents (edge case safety)
      submissions.forEach((sub) => {
        const uid = sub.studentUid || sub.studentId || sub.id;
        const existsInRoster = roster.some(
          (r) => r.studentUid === uid || (r.studentPhone && r.studentPhone === sub.studentPhone)
        );
        if (!existsInRoster) {
          const isGraded = sub.grade !== undefined && sub.grade !== null;
          const normalizedGrade = normalizeAssignmentGrade(sub.grade);
          const answer = (
            sub.answerText ||
            sub.answer ||
            sub.code ||
            sub.solution ||
            sub.content ||
            sub.text ||
            ""
          ).trim();

          roster.push({
            studentUid: uid,
            studentName: sub.studentName || sub.name || "طالب مسجل",
            studentPhone: sub.studentPhone || "",
            group: sub.group || "خارج المجموعة",
            hasSubmitted: true,
            status: isGraded ? "graded" : "submitted",
            statusLabel: isGraded ? "تم التصحيح" : "تم التسليم (قيد التصحيح)",
            rawGrade: sub.grade,
            grade: normalizedGrade,
            gradeDisplay: isGraded ? `${normalizedGrade} / 10` : "قيد التصحيح",
            feedback: sub.feedback || "",
            answerText: answer,
            fileUrl: sub.fileUrl || "",
            submittedAt: sub.submittedAt || sub.createdAt || null,
            submissionId: sub.id,
            submission: sub
          });
        }
      });

      // Sort: submitted first (most recent), then unsubmitted alphabetically
      roster.sort((a, b) => {
        if (a.hasSubmitted && !b.hasSubmitted) return -1;
        if (!a.hasSubmitted && b.hasSubmitted) return 1;
        if (a.hasSubmitted && b.hasSubmitted) {
          const tA = a.submittedAt?.toDate?.() || new Date(a.submittedAt || 0);
          const tB = b.submittedAt?.toDate?.() || new Date(b.submittedAt || 0);
          return tB - tA;
        }
        return a.studentName.localeCompare(b.studentName, "ar");
      });

      const totalEligible = roster.length;
      const submittedCount = roster.filter((r) => r.hasSubmitted).length;
      const notSubmittedCount = totalEligible - submittedCount;
      const gradedCount = roster.filter((r) => r.status === "graded").length;
      const pendingCount = roster.filter((r) => r.status === "submitted").length;

      return {
        assignment,
        totalEligible,
        submittedCount,
        notSubmittedCount,
        gradedCount,
        pendingCount,
        roster
      };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
