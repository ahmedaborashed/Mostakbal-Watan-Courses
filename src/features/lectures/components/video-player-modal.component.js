// src/features/lectures/components/video-player-modal.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";

/**
 * Renders the modal containing the embedded media player (YouTube / Google Drive).
 */
export function renderVideoPlayerModal() {
  const bodyHtml = `
    <div class="video-player-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:var(--radius-md);background:#000;box-shadow:var(--shadow-md);">
      <iframe
        id="videoPlayerFrame"
        src=""
        title="مشغل الفيديو التعليمي"
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
    <div id="videoPlayerFallbackNote" class="mt-3 text-xs text-muted d-flex items-center justify-between flex-wrap gap-2">
      <span>إذا تعذر تشغيل الفيديو داخل المتصفح، يمكنك فتحه مباشرة عبر الرابط الخارجي.</span>
      <a id="videoPlayerExternalLink" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
        فتح في نافذة مستقلة ↗
      </a>
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center justify-end w-full">
      <button type="button" class="btn btn-secondary" data-modal-close="videoPlayerModal">إغلاق</button>
    </div>
  `;

  return renderModal({
    id: "videoPlayerModal",
    title: `<span id="videoPlayerTitle">مشاهدة المحاضرة</span>`,
    bodyHtml,
    footerHtml,
    maxWidth: "800px"
  });
}
