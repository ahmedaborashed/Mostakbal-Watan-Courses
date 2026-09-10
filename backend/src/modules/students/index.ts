import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db, auth } from "../../config/firebase";
import { requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";

// Schema for student creation
const CreateStudentSchema = z.object({
  name: z.string().min(2, "الاسم يجب ألا يقل عن حرفين"),
  phone: z.string().regex(/^[0-9]{10,15}$/, "رقم الهاتف غير صالح"),
  nationalId: z.string().min(6, "الرقم القومي أو كلمة المرور يجب ألا تقل عن 6 أحرف"),
  address: z.string().optional().default(""),
  group: z.string().min(1, "يجب تحديد المجموعة")
});

export async function createStudentHandler(request: CallableRequest) {
  requireRole(request, ["teacher", "admin"]);
  const data = validateInput(CreateStudentSchema, request.data);

  const normalizedPhone = data.phone.trim();
  const studentEmail = `${normalizedPhone}@student.local`;
  const initialPassword = data.nationalId.trim();

  try {
    // 1. Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(studentEmail);
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") throw e;
    }

    if (userRecord) {
      throw new HttpsError("already-exists", `الطالب صاحب رقم الهاتف (${normalizedPhone}) مسجل بالفعل.`);
    }

    // 2. Create Auth User
    const newUser = await auth.createUser({
      email: studentEmail,
      password: initialPassword,
      displayName: data.name
    });

    // 3. Assign Custom Claims
    await auth.setCustomUserClaims(newUser.uid, {
      role: "student",
      group: data.group,
      phone: normalizedPhone
    });

    // 4. Save to Firestore (doc ID = Auth UID)
    const studentData = {
      name: data.name,
      studentPhone: normalizedPhone,
      nationalId: data.nationalId,
      address: data.address,
      group: data.group,
      active: true,
      authUid: newUser.uid,
      createdAt: new Date()
    };

    await db.collection("students").doc(newUser.uid).set(studentData);

    // Also sync to users collection
    await db.collection("users").doc(newUser.uid).set({
      name: data.name,
      phone: normalizedPhone,
      role: "student",
      group: data.group,
      createdAt: new Date()
    });

    return {
      success: true,
      studentUid: newUser.uid,
      message: "تم إنشاء حساب الطالب بنجاح"
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    console.error("Create Student Error:", error);
    throw new HttpsError("internal", error.message || "حدث خطأ أثناء إنشاء حساب الطالب");
  }
}

// Schema for resetting password
const ResetPasswordSchema = z.object({
  studentUid: z.string().min(1, "معرف الطالب مطلوب"),
  newPassword: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 خانات").optional()
});

export async function resetStudentPasswordHandler(request: CallableRequest) {
  requireRole(request, ["teacher", "admin"]);
  const data = validateInput(ResetPasswordSchema, request.data);

  try {
    // Get student record from Firestore to retrieve national ID if no custom password provided
    let passwordToSet = data.newPassword;
    if (!passwordToSet) {
      const studentDoc = await db.collection("students").doc(data.studentUid).get();
      if (!studentDoc.exists) {
        throw new HttpsError("not-found", "لم يتم العثور على بيانات الطالب في قاعدة البيانات.");
      }
      const studentData = studentDoc.data()!;
      passwordToSet = studentData.nationalId || studentData.studentPhone;
    }

    if (!passwordToSet || passwordToSet.length < 6) {
      throw new HttpsError("invalid-argument", "كلمة المرور المستهدفة يجب ألا تقل عن 6 أحرف.");
    }

    // Direct Auth update via Admin SDK (NO secondaryApp needed!)
    await auth.updateUser(data.studentUid, {
      password: passwordToSet
    });

    return {
      success: true,
      message: "تم تعيين كلمة المرور بنجاح"
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    console.error("Reset Password Error:", error);
    throw new HttpsError("internal", error.message || "فشل تعيين كلمة المرور");
  }
}

// Schema for deleting student
const DeleteStudentSchema = z.object({
  studentUid: z.string().min(1, "معرف الطالب مطلوب")
});

export async function deleteStudentHandler(request: CallableRequest) {
  requireRole(request, ["admin"]);
  const data = validateInput(DeleteStudentSchema, request.data);

  try {
    // 1. Delete from Auth
    try {
      await auth.deleteUser(data.studentUid);
    } catch (authErr: any) {
      console.warn("Auth user not found during delete, continuing with Firestore cleanup:", authErr);
    }

    // 2. Delete/Archive from Firestore
    await db.collection("students").doc(data.studentUid).delete();
    await db.collection("users").doc(data.studentUid).delete();

    return {
      success: true,
      message: "تم حذف الطالب بنجاح"
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    console.error("Delete Student Error:", error);
    throw new HttpsError("internal", error.message || "فشل حذف الطالب");
  }
}
