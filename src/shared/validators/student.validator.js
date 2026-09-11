// src/shared/validators/student.validator.js
import { ValidationError } from "../../core/errors.js";

export function validateStudentData({ name, phone, nationalId, address, group }) {
  const cleanName = (name || "").trim();
  const cleanPhone = (phone || "").trim().replace(/\s+/g, "");
  const cleanNatId = (nationalId || "").trim();
  const cleanAddress = (address || "").trim();
  const cleanGroup = (group || "").trim();

  const fieldErrors = {};

  if (!cleanName || cleanName.length < 3) {
    fieldErrors.name = "اسم الطالب يجب أن يكون 3 أحرف على الأقل.";
  }

  if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
    fieldErrors.phone = "رقم الهاتف يجب أن يكون رقماً مصرياً صالحاً (11 رقماً).";
  }

  if (!cleanGroup) {
    fieldErrors.group = "يرجى اختيار المجموعة الدراسية للطالب.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("يرجى مراجعة بيانات الطالب والتأكد من الحقول المطلوبة.", fieldErrors);
  }

  return {
    name: cleanName,
    phone: cleanPhone,
    nationalId: cleanNatId,
    address: cleanAddress,
    group: cleanGroup
  };
}

/**
 * Validates student data for EDIT operations.
 * Phone is not editable (tied to Auth), so it's excluded from validation.
 * @param {object} data - { name, nationalId, address, group }
 * @returns {object} Cleaned and validated data
 * @throws {ValidationError}
 */
export function validateStudentEditData({ name, nationalId, address, group }) {
  const cleanName = (name || "").trim();
  const cleanNatId = (nationalId || "").trim();
  const cleanAddress = (address || "").trim();
  const cleanGroup = (group || "").trim();

  const fieldErrors = {};

  if (!cleanName || cleanName.length < 3) {
    fieldErrors.name = "اسم الطالب يجب أن يكون 3 أحرف على الأقل.";
  }

  if (!cleanGroup) {
    fieldErrors.group = "يرجى اختيار المجموعة الدراسية للطالب.";
  }

  if (cleanNatId && !/^\d{14}$/.test(cleanNatId)) {
    fieldErrors.nationalId = "الرقم القومي يجب أن يتكون من 14 رقماً بالضبط.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("يرجى مراجعة بيانات الطالب والتأكد من الحقول المطلوبة.", fieldErrors);
  }

  return {
    studentName: cleanName,
    nationalId: cleanNatId,
    address: cleanAddress,
    studentGroup: cleanGroup
  };
}
