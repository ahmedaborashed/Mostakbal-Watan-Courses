// src/features/students/components/student-detail.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns the HTML for the Student Detail modal shell (injected once).
 */
export function renderStudentDetailModal() {
  const bodyHtml = `<div id="studentDetailBody"></div>`;
  return renderModal({
    id: "studentDetailModal",
    title: "👤 بيانات وملف الطالب",
    bodyHtml,
    maxWidth: "560px"
  });
}

/**
 * Returns HTML content for the student detail body.
 * @param {object} student - Student record
 * @param {boolean} canDelete - Whether delete action is available
 * @returns {string} HTML
 */
export function renderStudentDetailContent(student, { canDelete = false } = {}) {
  const uid = student.id || student.firestoreId || "";
  const name = student.studentName || student.name || "—";
  const phone = student.studentPhone || student.phone || "—";
  const nationalId = student.nationalId || student.studentNationalId || "";
  const address = student.address || student.studentAddress || "";
  const group = student.studentGroup || student.group || "—";

  const infoRow = (icon, label, value) => {
    if (!value) return "";
    return `
      <div class="d-flex items-center gap-3 py-3" style="border-bottom:1px solid var(--color-border-subtle);">
        <span style="font-size:1.3rem;width:28px;text-align:center;" aria-hidden="true">${icon}</span>
        <div style="flex:1;min-width:0;">
          <div class="text-xs text-muted mb-0.5">${escapeHtml(label)}</div>
          <div class="font-bold text-sm" style="word-break:break-word;">${escapeHtml(value)}</div>
        </div>
      </div>
    `;
  };

  return `
    <div class="text-center mb-5 pt-2">
      <div style="display:flex;justify-content:center;margin-bottom:0.75rem;">
        ${renderAvatar({ name, size: "lg" })}
      </div>
      <h3 class="font-extrabold mb-1" style="font-size:1.25rem;">${escapeHtml(name)}</h3>
      ${renderBadge({ text: group, variant: "gold", icon: "📚" })}
    </div>

    <div class="mb-5">
      ${infoRow("📱", "رقم الهاتف (اسم المستخدم)", phone)}
      ${infoRow("🆔", "الرقم القومي", nationalId)}
      ${infoRow("📍", "العنوان ومحل الإقامة", address)}
      ${infoRow("👥", "المجموعة الدراسية", group)}
    </div>

    <div class="d-flex flex-wrap gap-2 mt-4">
      ${renderButton({
        text: "✏️ تعديل البيانات",
        variant: "primary",
        size: "sm",
        extraAttrs: `data-detail-edit-student="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
      })}
      ${renderButton({
        text: "🔑 إعادة تعيين كلمة المرور",
        variant: "secondary",
        size: "sm",
        extraAttrs: `data-detail-reset-pass="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
      })}
      ${canDelete ? renderButton({
        text: "🗑️ حذف الحساب",
        variant: "danger",
        size: "sm",
        extraAttrs: `data-detail-delete-student="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
      }) : ""}
    </div>
  `;
}
