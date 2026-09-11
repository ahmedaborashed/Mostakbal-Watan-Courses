// src/features/students/students.service.js
import { callApi } from "../../repositories/api.client.js";
import app, { db } from "../../core/firebase.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError, isCloudFunctionUnavailable } from "../../core/errors.js";

function getSecondaryAuth() {
  const secondaryAppName = "StudentCreationSecondaryApp";
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const secApp = existingApp || initializeApp(app.options, secondaryAppName);
  return getAuth(secApp);
}

export const StudentsService = {
  /**
   * Fetches all registered students (Teacher / Admin).
   */
  async getAllStudents() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      return snap.docs.map((d) => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches single student record by Auth UID (O(1) lookup).
   */
  async getStudentProfile(uid) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
      if (docSnap.exists()) {
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async getStudentByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();
    try {
      // 1. Direct O(1) lookup for legacy documents keyed by phone (complies with get rule)
      const directSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, cleanPhone));
      if (directSnap.exists()) {
        return { id: directSnap.id, firestoreId: directSnap.id, ...directSnap.data() };
      }

      // 2. Query fallback with limit(1)
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        where("studentPhone", "==", cleanPhone),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.warn("Student phone lookup warning:", err?.message || err);
      return null;
    }
  },

  /**
   * Creates a new student via Cloud Function with auto Auth user generation,
   * and provides a resilient direct secondary Auth + Firestore fallback.
   */
  async createStudent({ name, phone, nationalId, address, group }) {
    try {
      return await callApi("createStudent", {
        name,
        phone,
        nationalId,
        address,
        group
      });
    } catch (err) {
      console.warn("Cloud function createStudent unavailable, executing direct secondary Auth fallback:", err?.message || err);
      if (!isCloudFunctionUnavailable(err) && err.code !== "APP_ERROR") {
        throw normalizeError(err);
      }
    }

    try {
      const normalizedPhone = String(phone || "").trim().replace(/\s+/g, "");
      const studentEmail = `${normalizedPhone}@student.local`;
      const initialPassword = String(nationalId || "123456").trim();

      const secAuth = getSecondaryAuth();
      let newUser = null;

      try {
        const cred = await createUserWithEmailAndPassword(secAuth, studentEmail, initialPassword);
        newUser = cred.user;
      } catch (authErr) {
        if (authErr.code === "auth/email-already-in-use") {
          throw new Error(`الطالب صاحب رقم الهاتف (${normalizedPhone}) مسجل بالفعل.`);
        }
        throw authErr;
      } finally {
        try {
          await signOut(secAuth);
        } catch (_) {}
      }

      const studentUid = newUser?.uid || normalizedPhone;
      const studentPayload = {
        name: (name || "").trim(),
        studentPhone: normalizedPhone,
        phone: normalizedPhone,
        nationalId: (nationalId || "").trim(),
        address: (address || "").trim(),
        group: group || "ALL",
        active: true,
        authUid: studentUid,
        role: "student",
        createdAt: serverTimestamp()
      };

      // 1. Save to students collection keyed by Auth UID
      await setDoc(doc(db, COLLECTIONS.STUDENTS, studentUid), studentPayload, { merge: true });

      // 2. Also save phone-keyed record for backward compatibility
      if (studentUid !== normalizedPhone) {
        try {
          await setDoc(doc(db, COLLECTIONS.STUDENTS, normalizedPhone), studentPayload, { merge: true });
        } catch (_) {}
      }

      // 3. Sync to users collection
      try {
        await setDoc(doc(db, "users", studentUid), {
          name: studentPayload.name,
          phone: normalizedPhone,
          role: "student",
          group: studentPayload.group,
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (_) {}

      return {
        success: true,
        studentUid,
        message: "تم إنشاء حساب الطالب بنجاح ✅"
      };
    } catch (fallbackErr) {
      throw normalizeError(fallbackErr);
    }
  },

  /**
   * Resets student password securely via Cloud Function with direct Firestore fallback.
   */
  async resetPassword(studentUid, newPassword) {
    try {
      return await callApi("resetStudentPassword", {
        studentUid,
        newPassword
      });
    } catch (err) {
      console.warn("Cloud function resetStudentPassword unavailable, executing direct Firestore fallback:", err?.message || err);
      if (!isCloudFunctionUnavailable(err) && err.code !== "APP_ERROR") {
        throw normalizeError(err);
      }
    }

    try {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentUid);
      const studentSnap = await getDoc(studentRef);
      const passToSet = newPassword || studentSnap.data()?.nationalId || "123456";

      await updateDoc(studentRef, {
        pass: passToSet,
        nationalId: passToSet,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: "تم تعيين كلمة المرور بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Deletes a student account via Cloud Function (Admin only) with direct Firestore fallback.
   */
  async deleteStudent(studentUid) {
    try {
      return await callApi("deleteStudent", {
        studentUid
      });
    } catch (err) {
      console.warn("Cloud function deleteStudent unavailable, executing direct Firestore fallback:", err?.message || err);
      if (!isCloudFunctionUnavailable(err) && err.code !== "APP_ERROR") {
        throw normalizeError(err);
      }
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentUid));
      try {
        await deleteDoc(doc(db, "users", studentUid));
      } catch (_) {}

      return {
        success: true,
        message: "تم حذف الطالب بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Updates student information in Firestore.
   */
  async updateStudent(studentId, data) {
    try {
      await updateDoc(doc(db, COLLECTIONS.STUDENTS, studentId), data);
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
