// src/features/students/components/student-edit.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderInput, renderSelect } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML for the Edit Student modal (injected once into DOM).
 */
export function renderEditStudentModal() {
  const groupOptions = [
    { value: "", label: "-- اختر المجموعة الدراسية --" },
    ...GROUPS.map((g) => ({ value: g, label: g }))
  ];

  const bodyHtml = `
    <form id="editStudentForm" onsubmit="return false;">
      <input type="hidden" id="editStudentUid" value="" />

      <div class="p-3 mb-4" style="background:var(--color-bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--color-border-subtle);">
        <span class="text-xs text-muted d-block mb-1">تعديل بيانات الطالب:</span>
        <strong id="editStudentNameHint" class="text-accent font-extrabold" style="font-size:1.1rem;"></strong>
      </div>

      ${renderInput({
        id: "editStudentName",
        label: "اسم الطالب بالكامل",
        placeholder: "مثال: أحمد محمد علي",
        required: true
      })}

      ${renderInput({
        id: "editStudentPhone",
        label: "رقم الهاتف (اسم المستخدم)",
        placeholder: "لا يمكن تعديل رقم الهاتف",
        disabled: true,
        hint: "رقم الهاتف مربوط بحساب تسجيل الدخول ولا يمكن تغييره"
      })}

      ${renderInput({
        id: "editStudentNationalId",
        label: "الرقم القومي (اختياري)",
        placeholder: "14 رقم قومي"
      })}

      ${renderInput({
        id: "editStudentAddress",
        label: "العنوان ومحل الإقامة (اختياري)",
        placeholder: "المحلة الكبرى - ..."
      })}

      ${renderSelect({
        id: "editStudentGroup",
        label: "المجموعة الدراسية",
        options: groupOptions,
        required: true
      })}

      <div class="mt-6 text-left">
        ${renderButton({
          id: "submitEditStudentBtn",
          text: "حفظ التعديلات ✅",
          type: "submit",
          variant: "primary",
          className: "w-full btn-lg"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "editStudentModal",
    title: "✏️ تعديل بيانات الطالب",
    bodyHtml,
    maxWidth: "600px"
  });
}

/**
 * Populates the edit form fields with a student's current data.
 * @param {object} student - Current student data
 */
export function populateEditStudentForm(student) {
  const uid = student.id || student.firestoreId || "";
  const name = student.studentName || student.name || "";
  const phone = student.studentPhone || student.phone || "";
  const nationalId = student.nationalId || student.studentNationalId || "";
  const address = student.address || student.studentAddress || "";
  const group = student.studentGroup || student.group || "";

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal("editStudentUid", uid);
  setVal("editStudentName", name);
  setVal("editStudentPhone", phone);
  setVal("editStudentNationalId", nationalId);
  setVal("editStudentAddress", address);
  setVal("editStudentGroup", group);

  const hintEl = document.getElementById("editStudentNameHint");
  if (hintEl) hintEl.textContent = name;
}
