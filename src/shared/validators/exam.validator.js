// src/shared/validators/exam.validator.js
import { ValidationError } from "../../core/errors.js";

export function validateExamData({ title, duration, questions = [] }) {
  const cleanTitle = (title || "").trim();
  const durNum = Number(duration);
  const fieldErrors = {};

  if (!cleanTitle) {
    fieldErrors.title = "يرجى كتابة عنوان للامتحان.";
  }
  if (isNaN(durNum) || durNum <= 0) {
    fieldErrors.duration = "مدة الامتحان يجب أن تكون رقماً أكبر من صفر بالدقائق.";
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    fieldErrors.questions = "يجب إضافة سؤال واحد على الأقل للامتحان.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("بيانات الامتحان غير مكتملة.", fieldErrors);
  }

  return {
    title: cleanTitle,
    duration: durNum,
    questions
  };
}
