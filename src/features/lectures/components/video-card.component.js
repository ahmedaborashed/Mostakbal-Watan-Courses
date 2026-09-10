// src/features/lectures/components/video-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

/**
 * Returns HTML string for student lecture card.
 */
export function renderStudentVideoCard({ lecture, isWatched }) {
  const badgeHtml = isWatched
    ? renderBadge({ text: "تمت المشاهدة", variant: "success", icon: "✓" })
    : renderBadge({ text: "جديد", variant: "primary", icon: "✨" });

  const contentHtml = `
    <div class="d-flex items-center justify-between mb-3">
      ${badgeHtml}
      <span class="text-sm text-muted">فيديو تعليمي</span>
    </div>
    <h4 class="font-bold mb-3" style="font-size:1.05rem;">${escapeHtml(lecture.name || "درس بدون عنوان")}</h4>
  `;

  const footerHtml = renderButton({
    text: "مشاهدة الفيديو ▶",
    variant: isWatched ? "secondary" : "primary",
    className: "w-full",
    extraAttrs: `data-play-video="${escapeHtml(lecture.id)}" data-video-id="${escapeHtml(lecture.videoId || "")}" data-video-name="${escapeHtml(lecture.name || "")}"`
  });

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}

/**
 * Returns HTML string for teacher lecture card.
 */
export function renderTeacherVideoCard({ lecture }) {
  const contentHtml = `
    <div class="d-flex items-center justify-between mb-2">
      ${renderBadge({ text: lecture.group || "ALL", variant: "gold", icon: "👥" })}
      <span class="text-xs text-muted">ID: ${escapeHtml(lecture.videoId || "—")}</span>
    </div>
    <h4 class="font-bold mb-3">${escapeHtml(lecture.name || "بدون عنوان")}</h4>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-2 w-full justify-between">
      ${renderButton({
        text: "مشاهدة",
        size: "sm",
        variant: "outline",
        extraAttrs: `data-teacher-preview="${escapeHtml(lecture.id)}" data-video-id="${escapeHtml(lecture.videoId || "")}"`
      })}
      <div class="d-flex gap-1">
        ${renderButton({
          text: "تعديل",
          size: "sm",
          variant: "secondary",
          extraAttrs: `data-teacher-edit="${escapeHtml(lecture.id)}" data-video-name="${escapeHtml(lecture.name || "")}"`
        })}
        ${renderButton({
          text: "حذف",
          size: "sm",
          variant: "danger",
          extraAttrs: `data-teacher-delete="${escapeHtml(lecture.id)}"`
        })}
      </div>
    </div>
  `;

  return renderCard({
    content: contentHtml,
    footer: footerHtml,
    interactive: true
  });
}
