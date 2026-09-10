// src/features/students/components/student-form.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderInput, renderSelect } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { GROUPS } from "../../../core/constants.js";

export function renderAddStudentModal() {
  const groupOptions = [
    { value: "", label: "-- اختر المجموعة --" },
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
        label: "رقم الهاتف (اسم المستخدم)",
        placeholder: "010xxxxxxxx",
        required: true
      })}

      ${renderInput({
        id: "newStudentNationalId",
        label: "الرقم القومي (اختياري)",
        placeholder: "14 رقم"
      })}

      ${renderInput({
        id: "newStudentAddress",
        label: "العنوان (اختياري)",
        placeholder: "المحلة الكبرى - ..."
      })}

      ${renderSelect({
        id: "newStudentGroup",
        label: "المجموعة الدراسية",
        options: groupOptions,
        required: true
      })}

      <div class="mt-4 text-left">
        ${renderButton({
          id: "submitAddStudentBtn",
          text: "إضافة الطالب وتوليد الحساب 🚀",
          type: "submit",
          variant: "primary",
          className: "w-full"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "addStudentModal",
    title: "👥 إضافة طالب جديد",
    bodyHtml
  });
}

export function renderResetPasswordModal() {
  const bodyHtml = `
    <form id="resetStudentPasswordForm" onsubmit="return false;">
      <input type="hidden" id="resetPasswordStudentUid" value="" />
      <p class="text-sm text-muted mb-3" id="resetPasswordStudentNameHint"></p>

      ${renderInput({
        id: "resetNewPasswordInput",
        type: "password",
        label: "كلمة المرور الجديدة",
        placeholder: "6 أحرف على الأقل",
        required: true
      })}

      <div class="mt-4">
        ${renderButton({
          id: "submitResetPasswordBtn",
          text: "حفظ كلمة المرور الجديدة 🔐",
          type: "submit",
          variant: "primary",
          className: "w-full"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "resetStudentPasswordModal",
    title: "🔐 إعادة تعيين كلمة المرور",
    bodyHtml
  });
}
