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
    return new NotFoundError(rawMessage || "العنصر المطلوب غير موجود.");
  }
  if (rawCode === "functions/already-exists" || rawCode === "already-exists") {
    return new AppError(rawMessage || "البيانات مسجلة مسبقاً.", "ALREADY_EXISTS");
  }
  if (rawCode === "functions/deadline-exceeded" || rawCode === "deadline-exceeded") {
    return new AppError(rawMessage || "انتهى الوقت المحدد لتنفيذ العملية.", "DEADLINE_EXCEEDED");
  }

  return new AppError(rawMessage || "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.", "UNKNOWN_ERROR", error);
}
