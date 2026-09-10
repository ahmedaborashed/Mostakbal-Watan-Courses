// src/repositories/api.client.js
import { functions, httpsCallable } from "../core/firebase.js";

/**
 * Executes a Firebase HTTPS Callable Cloud Function with unified error handling.
 */
export async function callApi(functionName, data = {}) {
  try {
    const fn = httpsCallable(functions, functionName);
    const result = await fn(data);
    return result.data;
  } catch (error) {
    console.error(`API Call [${functionName}] Error:`, error);
    
    // Map Firebase HttpsError codes to friendly Arabic messages
    let friendlyMessage = error.message || "حدث خطأ غير متوقع أثناء الاتصال بالسيرفر.";
    if (error.code === "functions/permission-denied") {
      friendlyMessage = "ليس لديك الصلاحية لتنفيذ هذا الإجراء.";
    } else if (error.code === "functions/unauthenticated") {
      friendlyMessage = "انتهت جلستك، يرجى إعادة تسجيل الدخول.";
    } else if (error.code === "functions/already-exists") {
      friendlyMessage = error.message || "البيانات مسجلة مسبقاً.";
    } else if (error.code === "functions/not-found") {
      friendlyMessage = error.message || "العنصر المطلوب غير موجود.";
    } else if (error.code === "functions/deadline-exceeded") {
      friendlyMessage = error.message || "انتهى الوقت المحدد لتنفيذ العملية.";
    }

    const customError = new Error(friendlyMessage);
    customError.code = error.code;
    throw customError;
  }
}
