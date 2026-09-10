// src/features/students/components/student-form.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderInput, renderSelect } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { GROUPS } from "../../../core/constants.js";

export function renderAddStudentModal() {
  const groupOptions = [
    { value: "", label: "-- اختر المجموعة الدراسية --" },
    ...GROUPS.map((g) => ({ value: g, label: g }))
  ];

  const bodyHtml = `
    <form id="addStudentForm" onsubmit="return false;">
      ${renderInput({
        id: "newStudentName",
        label: "اسم الطالب بالكامل",
        placeholder: "مثال: أحمد محمد علي",
        required: true
      })}

      ${renderInput({
        id: "newStudentPhone",
        label: "رقم الهاتف (سيكون اسم المستخدم لتسجيل الدخول)",
        placeholder: "010xxxxxxxx",
        required: true,
        hint: "سيتم إنشاء حساب تلقائي بكلمة مرور افتراضية (123456) أو رقم الهاتف"
      })}

      ${renderInput({
        id: "newStudentNationalId",
        label: "الرقم القومي (اختياري)",
        placeholder: "14 رقم قومي"
      })}

      ${renderInput({
        id: "newStudentAddress",
        label: "العنوان ومحل الإقامة (اختياري)",
        placeholder: "المحلة الكبرى - ..."
      })}

      ${renderSelect({
        id: "newStudentGroup",
        label: "المجموعة الدراسية",
        options: groupOptions,
        required: true
      })}

      <div class="mt-6 text-left">
        ${renderButton({
          id: "submitAddStudentBtn",
          text: "إضافة الطالب وتوليد الحساب الأكاديمي 🚀",
          type: "submit",
          variant: "primary",
          className: "w-full btn-lg"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "addStudentModal",
    title: "👥 إضافة طالب جديد إلى المنصة",
    bodyHtml,
    maxWidth: "600px"
  });
}

export function renderResetPasswordModal() {
  const bodyHtml = `
    <form id="resetStudentPasswordForm" onsubmit="return false;">
      <input type="hidden" id="resetPasswordStudentUid" value="" />
      <div class="p-3 mb-4" style="background:var(--color-bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--color-border-subtle);">
        <span class="text-xs text-muted d-block mb-1">تعيين كلمة مرور جديدة للطالب:</span>
        <strong id="resetPasswordStudentNameHint" class="text-accent font-extrabold" style="font-size:1.1rem;"></strong>
      </div>

      ${renderInput({
        id: "resetNewPasswordInput",
        type: "password",
        label: "كلمة المرور الجديدة",
        placeholder: "6 أحرف أو أرقام على الأقل",
        required: true
      })}

      <div class="mt-6">
        ${renderButton({
          id: "submitResetPasswordBtn",
          text: "حفظ كلمة المرور الجديدة 🔐",
          type: "submit",
          variant: "primary",
          className: "w-full btn-lg"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "resetStudentPasswordModal",
    title: "🔐 إعادة تعيين كلمة المرور لطالب",
    bodyHtml,
    maxWidth: "480px"
  });
}
