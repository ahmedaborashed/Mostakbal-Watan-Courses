// src/features/profile/components/profile-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";

/**
 * Returns HTML string for student profile details view.
 */
export function renderProfileCard({ student }) {
  const name = student?.studentName || student?.name || "طالب";
  const phone = student?.studentPhone || student?.phone || "—";
  const natId = student?.studentNationalId || student?.nationalId || "—";
  const address = student?.studentAddress || student?.address || "—";
  const group = student?.studentGroup || student?.group || "ALL";

  const contentHtml = `
    <div class="d-flex items-center gap-4 mb-6 p-4" style="background:var(--color-bg-secondary);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);">
      ${renderAvatar({ name, size: "xl" })}
      <div>
        <h3 class="font-black" style="font-size:1.5rem;color:var(--color-text-primary);margin:0;">${escapeHtml(name)}</h3>
        <span class="text-sm text-muted font-bold d-block mt-1" style="direction:ltr;text-align:right;">${escapeHtml(phone)}</span>
        <div class="mt-2">
          ${renderBadge({ text: "حساب طالب نشط", variant: "primary", icon: "✓" })}
        </div>
      </div>
    </div>

    <div class="table-wrapper mb-4">
      <table class="table-modern">
        <tbody>
          <tr>
            <td style="width:180px;color:var(--color-text-muted);font-weight:700;">المجموعة الدراسية</td>
            <td>${renderBadge({ text: group, variant: "gold", icon: "👥" })}</td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">اسم المستخدم / الهاتف</td>
            <td><strong style="direction:ltr;display:inline-block;">${escapeHtml(phone)}</strong></td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">الرقم القومي</td>
            <td>${escapeHtml(natId)}</td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">العنوان ومحل الإقامة</td>
            <td>${escapeHtml(address)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const footerHtml = renderButton({
    id: "openChangePasswordModalBtn",
    text: "تغيير كلمة المرور الخاصة بحسابي 🔐",
    variant: "outline",
    className: "w-full btn-md"
  });

  return renderCard({
    title: "البيانات الأساسية للحساب الأكاديمي",
    icon: "👤",
    content: contentHtml,
    footer: footerHtml
  });
}
