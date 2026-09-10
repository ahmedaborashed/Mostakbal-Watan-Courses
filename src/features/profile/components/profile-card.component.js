// src/features/profile/components/profile-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";

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
    <div class="d-flex items-center gap-3 mb-4">
      <div class="sidebar-avatar" style="width:64px;height:64px;font-size:1.8rem;">${name.trim().charAt(0)}</div>
      <div>
        <h3 class="font-extrabold" style="font-size:1.35rem;">${escapeHtml(name)}</h3>
        <span class="text-sm text-muted" style="direction:ltr;display:inline-block;">${escapeHtml(phone)}</span>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="table-modern">
        <tbody>
          <tr>
            <td style="width:140px;color:var(--text-muted);font-weight:700;">المجموعة الدراسية</td>
            <td>${renderBadge({ text: group, variant: "gold" })}</td>
          </tr>
          <tr>
            <td style="color:var(--text-muted);font-weight:700;">الرقم القومي</td>
            <td>${escapeHtml(natId)}</td>
          </tr>
          <tr>
            <td style="color:var(--text-muted);font-weight:700;">العنوان</td>
            <td>${escapeHtml(address)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const footerHtml = renderButton({
    id: "openChangePasswordModalBtn",
    text: "تغيير كلمة المرور 🔐",
    variant: "outline",
    className: "w-full"
  });

  return renderCard({
    title: "بيانات الحساب",
    icon: "👤",
    content: contentHtml,
    footer: footerHtml
  });
}
