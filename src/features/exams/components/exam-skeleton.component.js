// src/features/exams/components/exam-skeleton.component.js

/**
 * Returns HTML string for exam list loading skeletons.
 */
export function renderExamListSkeleton(count = 3) {
  const cards = Array.from({ length: count }, () => `
    <div class="card p-5" style="border: 1px solid var(--border);">
      <div class="d-flex items-center justify-between mb-3">
        <div class="skeleton" style="width: 75px; height: 22px; border-radius: 9999px;"></div>
        <div class="skeleton" style="width: 90px; height: 16px;"></div>
      </div>
      <div class="skeleton mb-2" style="width: 80%; height: 24px;"></div>
      <div class="skeleton mb-4" style="width: 60%; height: 14px;"></div>
      <div class="d-flex items-center gap-4 mb-4">
        <div class="skeleton" style="width: 70px; height: 16px;"></div>
        <div class="skeleton" style="width: 70px; height: 16px;"></div>
      </div>
      <div class="skeleton mt-3" style="width: 100%; height: 40px; border-radius: var(--radius-md);"></div>
    </div>
  `).join("");

  return `<div class="grid-3">${cards}</div>`;
}

/**
 * Returns HTML string for exam question loading skeleton in Exam Mode.
 */
export function renderExamQuestionSkeleton() {
  return `
    <div class="card p-6" style="border: 1px solid var(--border);">
      <div class="d-flex items-center justify-between mb-4">
        <div class="skeleton" style="width: 110px; height: 26px; border-radius: 9999px;"></div>
        <div class="skeleton" style="width: 80px; height: 18px;"></div>
      </div>
      <div class="skeleton mb-2" style="width: 90%; height: 28px;"></div>
      <div class="skeleton mb-6" style="width: 60%; height: 20px;"></div>
      <div class="d-flex flex-col gap-3">
        <div class="skeleton" style="width: 100%; height: 52px; border-radius: var(--radius-md);"></div>
        <div class="skeleton" style="width: 100%; height: 52px; border-radius: var(--radius-md);"></div>
        <div class="skeleton" style="width: 100%; height: 52px; border-radius: var(--radius-md);"></div>
        <div class="skeleton" style="width: 100%; height: 52px; border-radius: var(--radius-md);"></div>
      </div>
    </div>
  `;
}
