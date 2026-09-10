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
    : renderBadge({ text: "درس جديد", variant: "primary", icon: "✨" });

  const cleanVideoId = (lecture.videoId || "").replace(/.*v=/, "").replace(/.*youtu\.be\//, "").split("&")[0].split("?")[0];
  const thumbUrl = cleanVideoId ? `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg` : "";

  const thumbnailHtml = thumbUrl
    ? `
      <div style="position:relative;width:100%;height:160px;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);background:var(--color-bg-secondary);">
        <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(lecture.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);display:grid;place-items:center;transition:background 0.2s;" class="video-thumb-overlay">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--color-primary);color:var(--color-text-inverse);display:grid;place-items:center;font-size:1.2rem;box-shadow:0 4px 14px var(--color-primary-glow);">▶</div>
        </div>
      </div>
    `
    : `
      <div style="position:relative;width:100%;height:110px;border-radius:var(--radius-md);background:var(--color-bg-secondary);display:grid;place-items:center;margin-bottom:var(--space-3);font-size:2.5rem;opacity:0.85;">
        📺
      </div>
    `;

  const contentHtml = `
    ${thumbnailHtml}
    <div class="d-flex items-center justify-between mb-2">
      ${badgeHtml}
      <span class="text-xs text-muted">فيديو تعليمي</span>
    </div>
    <h4 class="font-bold mb-2" style="font-size:1.05rem;line-height:1.4;">${escapeHtml(lecture.name || "درس بدون عنوان")}</h4>
  `;

  const footerHtml = renderButton({
    text: isWatched ? "إعادة المشاهدة ↺" : "بدء المشاهدة ▶",
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
  const cleanVideoId = (lecture.videoId || "").replace(/.*v=/, "").replace(/.*youtu\.be\//, "").split("&")[0].split("?")[0];
  const thumbUrl = cleanVideoId ? `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg` : "";

  const thumbnailHtml = thumbUrl
    ? `
      <div style="position:relative;width:100%;height:140px;border-radius:var(--radius-md);overflow:hidden;margin-bottom:var(--space-3);background:var(--color-bg-secondary);">
        <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(lecture.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
      </div>
    `
    : "";

  const contentHtml = `
    ${thumbnailHtml}
    <div class="d-flex items-center justify-between mb-2">
      ${renderBadge({ text: lecture.group || "ALL", variant: "gold", icon: "👥" })}
      <span class="text-xs text-muted">ID: ${escapeHtml(cleanVideoId || "—")}</span>
    </div>
    <h4 class="font-bold mb-3" style="font-size:1rem;">${escapeHtml(lecture.name || "بدون عنوان")}</h4>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-2 w-full justify-between">
      ${renderButton({
        text: "معاينة",
        size: "sm",
        variant: "outline",
        extraAttrs: `data-teacher-preview="${escapeHtml(lecture.id)}" data-video-id="${escapeHtml(lecture.videoId || "")}"`
      })}
      <div class="d-flex gap-1">
        ${renderButton({
          text: "حذف 🗑️",
          size: "sm",
          variant: "danger",
          extraAttrs: `data-teacher-delete="${escapeHtml(lecture.id)}" data-video-name="${escapeHtml(lecture.name || "")}"`
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
