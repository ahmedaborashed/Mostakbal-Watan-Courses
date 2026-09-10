// src/shared/components/Skeleton/skeleton.component.js

/**
 * Returns HTML for card shimmer skeletons.
 * @param {number} [count=3]
 * @returns {string}
 */
export function renderSkeletonCards(count = 3) {
  let cardsHtml = "";
  for (let i = 0; i < count; i++) {
    cardsHtml += `
      <div class="card skeleton-card skeleton" aria-hidden="true" style="min-height:160px;">
        <div class="skeleton skeleton-title" style="width:50%;"></div>
        <div class="skeleton skeleton-text" style="width:85%;"></div>
        <div class="skeleton skeleton-text" style="width:65%;"></div>
      </div>
    `;
  }
  return `<div class="grid-3" role="status" aria-label="جاري تحميل المحتوى">${cardsHtml}</div>`;
}

/**
 * Returns HTML for table row shimmer skeletons.
 * @param {number} [rows=4]
 * @returns {string}
 */
export function renderSkeletonTable(rows = 4) {
  let rowsHtml = "";
  for (let i = 0; i < rows; i++) {
    rowsHtml += `
      <tr>
        <td><div class="skeleton skeleton-text" style="width:80%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width:60%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width:40%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width:50%;"></div></td>
      </tr>
    `;
  }
  return `
    <div class="table-wrapper" role="status" aria-label="جاري تحميل الجدول">
      <table class="table-modern">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}
