// src/features/lectures/components/lesson-skeleton.component.js

/**
 * Returns HTML for the Student Lesson Library shimmer skeleton cards.
 * Designed specifically to mirror the student lesson card structure.
 * @param {number} [count=3]
 * @returns {string}
 */
export function renderStudentLessonSkeletonGrid(count = 3) {
  let cardsHtml = "";
  for (let i = 0; i < count; i++) {
    cardsHtml += `
      <div class="card student-lesson-card student-lesson-skeleton" aria-hidden="true">
        <div class="skeleton student-skeleton-media"></div>
        <div class="student-lesson-body">
          <div class="d-flex gap-2 mb-2">
            <div class="skeleton student-skeleton-chip" style="width: 55px;"></div>
            <div class="skeleton student-skeleton-chip" style="width: 70px;"></div>
          </div>
          <div class="skeleton student-skeleton-title"></div>
          <div class="skeleton student-skeleton-line" style="width: 95%;"></div>
          <div class="skeleton student-skeleton-line" style="width: 70%;"></div>
          <div class="d-flex gap-3 my-2">
            <div class="skeleton student-skeleton-meta" style="width: 80px;"></div>
            <div class="skeleton student-skeleton-meta" style="width: 90px;"></div>
          </div>
          <div class="skeleton student-skeleton-chip mt-2" style="width: 95px;"></div>
        </div>
        <div class="student-lesson-footer">
          <div class="skeleton student-skeleton-btn"></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="student-lessons-grid" role="status" aria-label="جاري تحميل المحاضرات...">
      ${cardsHtml}
    </div>
  `;
}
