// src/features/lectures/components/video-player-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";

/**
 * Renders the modal containing the YouTube embedded player.
 */
export function renderVideoPlayerModal() {
  const bodyHtml = `
    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:var(--radius-md);background:#000;">
      <iframe
        id="videoPlayerFrame"
        src=""
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  `;

  return renderModal({
    id: "videoPlayerModal",
    title: `<span id="videoPlayerTitle">مشاهدة الدرس</span>`,
    bodyHtml
  });
}
