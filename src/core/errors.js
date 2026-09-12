// src/core/errors.js

export class AppError extends Error {
  constructor(message, code = "APP_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message, details = null) {
    super(message, "AUTH_ERROR", details);
    this.name = "AuthError";
  }
}

export class ValidationError extends AppError {
  constructor(message, fieldErrors = {}) {
    super(message, "VALIDATION_ERROR", fieldErrors);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class PermissionError extends AppError {
  constructor(message = "ليس لديك الصلاحية لتنفيذ هذا الإجراء.") {
    super(message, "PERMISSION_DENIED");
    this.name = "PermissionError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "العنصر المطلوب غير موجود.") {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Maps raw Firebase/Cloud Function or unexpected JS exceptions to user-friendly AppError.
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const rawCode = error?.code || "";
  const rawMessage = error?.message || "";

  // Firebase Auth Error Codes
  if (rawCode === "auth/invalid-credential" || rawCode === "auth/user-not-found" || rawCode === "auth/wrong-password") {
    return new AuthError("بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مرة أخرى ❌");
  }
  if (rawCode === "auth/too-many-requests") {
    return new AuthError("تم حظر الدخول مؤقتاً لكثرة المحاولات الفاشلة. يرجى الانتظار والمحاولة لاحقاً ⏳");
  }
  if (rawCode === "auth/requires-recent-login") {
    return new AuthError("هذه العملية تتطلب تسجيل دخول حديث. يرجى إعادة تسجيل الدخول 🔐");
  }
  if (rawCode === "auth/email-already-in-use") {
    return new AuthError("هذا الحساب مسجل بالفعل مسبقاً ❌");
  }

  // Firebase Functions / Firestore Codes
  if (rawCode === "functions/permission-denied" || rawCode === "permission-denied") {
    return new PermissionError("ليس لديك الصلاحية لتنفيذ هذا الإجراء 🚫");
  }
  if (rawCode === "functions/unauthenticated" || rawCode === "unauthenticated") {
    return new AuthError("انتهت جلستك، يرجى إعادة تسجيل الدخول.");
  }
  if (rawCode === "functions/not-found" || rawCode === "not-found") {
    return new NotFoundError(rawMessage && rawMessage !== "internal" ? rawMessage : "الخدمة المطلوبة غير متوفرة حالياً في الخادم السحابي.");
  }
  if (rawCode === "functions/already-exists" || rawCode === "already-exists") {
    return new AppError(rawMessage || "البيانات مسجلة مسبقاً.", "ALREADY_EXISTS");
  }
  if (rawCode === "functions/deadline-exceeded" || rawCode === "deadline-exceeded") {
    return new AppError(rawMessage || "انتهى الوقت المحدد لتنفيذ العملية.", "DEADLINE_EXCEEDED");
  }
  if (rawCode === "functions/unavailable" || rawCode === "unavailable") {
    return new AppError("خدمة الخادم السحابي غير متوفرة حالياً. يرجى المحاولة لاحقاً.", "UNAVAILABLE", error);
  }
  if (
    rawCode === "functions/internal" ||
    rawCode === "internal" ||
    rawCode === "functions_internal" ||
    rawMessage === "internal" ||
    String(rawMessage).toLowerCase().includes("internal")
  ) {
    return new AppError("تعذر إتمام العملية عبر الخادم السحابي. يرجى استخدام الاتصال المباشر.", "FUNCTIONS_INTERNAL", error);
  }

  // Prevent raw unhelpful internal string from ever reaching UI toast
  const safeMessage = (rawMessage && !String(rawMessage).toLowerCase().includes("internal"))
    ? rawMessage
    : "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة لاحقاً.";
  return new AppError(safeMessage, "UNKNOWN_ERROR", error);
}

/**
 * Checks whether an error signifies that Firebase Cloud Functions are offline, undeployed, or unresponsive.
 * Useful for triggering direct client-side Firestore fallbacks.
 * @param {any} error
 * @returns {boolean}
 */
export function isCloudFunctionUnavailable(error) {
  if (!error) return false;
  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || "").toLowerCase();
  return (
    code === "functions/internal" ||
    code === "internal" ||
    code === "functions_internal" ||
    code === "functions/not-found" ||
    code === "not_found" ||
    code === "not-found" ||
    code === "functions/unavailable" ||
    code === "functions_unavailable" ||
    code === "unavailable" ||
    code === "app_error" ||
    code === "unknown_error" ||
    message === "internal" ||
    message.includes("internal") ||
    message.includes("cloud function") ||
    message.includes("الخادم السحابي") ||
    message.includes("غير مفعلة") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("not found")
  );
}
