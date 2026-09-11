// src/features/students/components/student-stats.component.js
import { renderStatCard } from "../../../shared/components/StatCard/stat-card.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the student management KPI statistics bar.
 * @param {Array} students - Full array of student records
 * @returns {string} HTML
 */
export function renderStudentStats(students = []) {
  const total = students.length;

  // Count students per group
  const groupCounts = {};
  GROUPS.forEach((g) => {
    groupCounts[g] = 0;
  });
  let ungrouped = 0;

  students.forEach((s) => {
    const group = s.studentGroup || s.group || "";
    if (group && groupCounts[group] !== undefined) {
      groupCounts[group]++;
    } else {
      ungrouped++;
    }
  });

  // Build stat cards
  const totalCard = renderStatCard({
    label: "إجمالي الطلاب المسجلين",
    value: total,
    icon: "👥",
    color: "var(--color-primary)",
    subtitle: "جميع المجموعات"
  });

  const groupCards = GROUPS.map((g, i) => {
    const icons = ["📘", "📗", "📙", "📕"];
    const colors = [
      "var(--color-info, #3b82f6)",
      "var(--color-success, #22c55e)",
      "var(--color-warning, #f59e0b)",
      "var(--color-accent, #a855f7)"
    ];
    // Extract short group name for subtitle
    const shortName = g.split("|")[0]?.trim() || g;
    return renderStatCard({
      label: shortName,
      value: groupCounts[g],
      icon: icons[i % icons.length],
      color: colors[i % colors.length],
      subtitle: `${groupCounts[g]} طالب مسجل`
    });
  }).join("");

  return `
    <div id="studentStatsBar" class="grid-3 mb-6">
      ${totalCard}
      ${groupCards}
    </div>
  `;
}
