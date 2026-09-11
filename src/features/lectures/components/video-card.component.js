// src/features/lectures/components/video-card.component.js
import { renderStudentLessonCard, renderTeacherLessonCard } from "./lesson-card.component.js";

/**
 * Backward-compatibility wrappers for legacy video card imports.
 */
export function renderStudentVideoCard({ lecture, isWatched }) {
  return renderStudentLessonCard({ lesson: lecture, isWatched });
}

export function renderTeacherVideoCard({ lecture }) {
  return renderTeacherLessonCard({ lesson: lecture });
}

export { renderStudentLessonCard, renderTeacherLessonCard };
