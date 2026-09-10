// src/shared/validators/auth.validator.js
import { ValidationError } from "../../core/errors.js";

export function validateLogin(username, password) {
  const cleanUser = (username || "").trim();
  const cleanPass = (password || "").trim();
  const fieldErrors = {};

  if (!cleanUser) {
    fieldErrors.username = "يرجى إدخال اسم المستخدم أو رقم الهاتف.";
  }
  if (!cleanPass) {
    fieldErrors.password = "يرجى إدخال كلمة المرور.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("يرجى إكمال بيانات تسجيل الدخول.", fieldErrors);
  }

  return { username: cleanUser, password: cleanPass };
}

export function validatePasswordChange(newPassword, confirmPassword) {
  const cleanNew = (newPassword || "").trim();
  const cleanConfirm = (confirmPassword || "").trim();
  const fieldErrors = {};

  if (!cleanNew || cleanNew.length < 6) {
    fieldErrors.newPassword = "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام.";
  }
  if (cleanNew !== cleanConfirm) {
    fieldErrors.confirmPassword = "كلمتا المرور غير متطابقتين.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("يرجى التأكد من تطابق كلمة المرور وصحتها.", fieldErrors);
  }

  return cleanNew;
}
