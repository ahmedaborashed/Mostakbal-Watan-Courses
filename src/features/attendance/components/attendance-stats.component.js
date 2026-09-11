// src/features/attendance/components/attendance-stats.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for the complete redesigned Student Attendance Dashboard.
 */
export function renderStudentAttendanceView({
  attendanceData,
  activeFilter = "all",
  sortOrder = "desc"
}) {
  if (!attendanceData) return "";

  const {
    totalSessions = 0,
    presentCount = 0,
    absentCount = 0,
    attendanceRate = 100,
    requiredRate = 75,
    status = "excellent",
    statusMessage = "معدل حضورك ممتاز ومستقر فوق الحد المطلوب ✅",
    currentStreak = 0,
    studentGroup = "ALL",
    sessions = []
  } = attendanceData;

  // If there are 0 sessions recorded yet
  if (totalSessions === 0 && sessions.length === 0) {
    return `
      <div class="attendance-dashboard">
        <div class="attendance-header">
          <div class="attendance-title-group">
            <h2><span>📊</span> سجل الحضور والغياب</h2>
            <p>تابع التزامك بالمحاضرات ومعدل حضورك الأكاديمي.</p>
          </div>
          <div class="attendance-group-pill">
            <span>👥</span>
            <span>المجموعة: ${escapeHtml(studentGroup)}</span>
          </div>
        </div>

        <div class="empty-state p-8 text-center" style="background:var(--color-surface);border:1px solid var(--color-border-subtle);border-radius:var(--radius-lg);">
          <div style="font-size:3rem;margin-bottom:1rem;">📋</div>
          <h3 class="font-extrabold text-lg mb-2" style="color:var(--color-text-primary);">لا توجد سجلات حضور مسجلة حتى الآن</h3>
          <p class="text-sm text-muted max-w-md mx-auto mb-4">
            لم يقم المعلم برصد أي كشوفات حضور لمجموعتك حتى هذه اللحظة. سيظهر سجلك الأكاديمي وإحصائيات التزامك هنا فور اعتماد أول جلسة.
          </p>
        </div>
      </div>
    `;
  }

  // Determine status styling
  let heroClass = "";
  let statusBadgeHtml = "";
  if (status === "excellent") {
    heroClass = "";
    statusBadgeHtml = `<span class="badge badge-success">✓ ممتاز</span>`;
  } else if (status === "warning") {
    heroClass = "warning";
    statusBadgeHtml = `<span class="badge badge-gold">⚠️ يحتاج متابعة</span>`;
  } else {
    heroClass = "danger";
    statusBadgeHtml = `<span class="badge badge-danger">✗ منخفض</span>`;
  }

  // Filter and sort sessions
  let filteredSessions = [...sessions];
  if (activeFilter === "present") {
    filteredSessions = filteredSessions.filter((s) => s.status === "present");
  } else if (activeFilter === "absent") {
    filteredSessions = filteredSessions.filter((s) => s.status === "absent");
  }

  if (sortOrder === "asc") {
    filteredSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    filteredSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Render Session Rows for Table
  const tableRowsHtml = filteredSessions.length > 0
    ? filteredSessions.map((session, idx) => {
        let badgeHtml = "";
        if (session.status === "present") {
          badgeHtml = `<span class="attendance-badge present">✓ حاضر</span>`;
        } else if (session.status === "upcoming") {
          badgeHtml = `<span class="attendance-badge upcoming">⏳ قادمة</span>`;
        } else {
          badgeHtml = `<span class="attendance-badge absent">✗ غائب</span>`;
        }

        return `
          <tr>
            <td>
              <strong>${escapeHtml(session.name)}</strong>
            </td>
            <td>
              <span class="text-muted text-sm">${formatDate(session.date)}</span>
            </td>
            <td>
              <span class="badge badge-outline">${escapeHtml(session.group || "ALL")}</span>
            </td>
            <td>
              ${badgeHtml}
            </td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="4" class="text-center text-muted p-6">
          لا توجد جلسات تطابق التصفية الحالية.
        </td>
      </tr>
    `;

  // Render Mobile Cards
  const mobileCardsHtml = filteredSessions.length > 0
    ? filteredSessions.map((session) => {
        let badgeHtml = "";
        if (session.status === "present") {
          badgeHtml = `<span class="attendance-badge present">✓ حاضر</span>`;
        } else if (session.status === "upcoming") {
          badgeHtml = `<span class="attendance-badge upcoming">⏳ قادمة</span>`;
        } else {
          badgeHtml = `<span class="attendance-badge absent">✗ غائب</span>`;
        }

        return `
          <div class="attendance-session-card">
            <div class="attendance-session-card-info">
              <strong>${escapeHtml(session.name)}</strong>
              <span>📅 ${formatDate(session.date)} · ${escapeHtml(session.group || "ALL")}</span>
            </div>
            <div>
              ${badgeHtml}
            </div>
          </div>
        `;
      }).join("")
    : `
      <div class="text-center text-muted p-4">لا توجد جلسات تطابق التصفية الحالية.</div>
    `;

  return `
    <div class="attendance-dashboard">
      <!-- 1. Header Bar -->
      <div class="attendance-header">
        <div class="attendance-title-group">
          <h2><span>📊</span> سجل الحضور والغياب</h2>
          <p>تابع التزامك بالمحاضرات ومعدل حضورك الأكاديمي.</p>
        </div>
        <div class="attendance-group-pill">
          <span>👥</span>
          <span>المجموعة: ${escapeHtml(studentGroup)}</span>
        </div>
      </div>

      <!-- 2. Primary KPI Stats Cards -->
      <div class="attendance-summary-grid">
        <!-- Hero: Attendance Rate -->
        <div class="attendance-stat-card hero-rate ${heroClass}">
          <div class="attendance-stat-card-header">
            <span class="attendance-stat-card-label">نسبة الالتزام الكلية</span>
            ${statusBadgeHtml}
          </div>
          <div class="attendance-stat-card-value text-${status === 'excellent' ? 'success' : (status === 'warning' ? 'warning' : 'danger')}">
            ${attendanceRate}%
          </div>
          <div class="attendance-stat-card-footer">
            <span>الحد الأدنى المطلوب لاجتياز الدورة: ${requiredRate}%</span>
          </div>
        </div>

        <!-- Present Sessions -->
        <div class="attendance-stat-card">
          <div class="attendance-stat-card-header">
            <span class="attendance-stat-card-label">المحاضرات المحضورة</span>
            <span class="attendance-stat-card-icon" style="color:#10b981;">✅</span>
          </div>
          <div class="attendance-stat-card-value text-success">
            ${presentCount}
          </div>
          <div class="attendance-stat-card-footer">
            <span>جلسة تم حضورها بنجاح</span>
          </div>
        </div>

        <!-- Absent Sessions -->
        <div class="attendance-stat-card">
          <div class="attendance-stat-card-header">
            <span class="attendance-stat-card-label">المحاضرات المتغيب عنها</span>
            <span class="attendance-stat-card-icon" style="color:#ef4444;">❌</span>
          </div>
          <div class="attendance-stat-card-value text-danger">
            ${absentCount}
          </div>
          <div class="attendance-stat-card-footer">
            <span>جلسة مسجلة غياب</span>
          </div>
        </div>

        <!-- Total Sessions -->
        <div class="attendance-stat-card">
          <div class="attendance-stat-card-header">
            <span class="attendance-stat-card-label">إجمالي المحاضرات</span>
            <span class="attendance-stat-card-icon" style="color:#60a5fa;">📅</span>
          </div>
          <div class="attendance-stat-card-value">
            ${totalSessions}
          </div>
          <div class="attendance-stat-card-footer">
            <span>جلسة منعقدة لمجموعتك</span>
          </div>
        </div>

        <!-- Attendance Streak -->
        <div class="attendance-stat-card">
          <div class="attendance-stat-card-header">
            <span class="attendance-stat-card-label">سلسلة المواظبة</span>
            <span class="attendance-stat-card-icon" style="color:#f59e0b;">🔥</span>
          </div>
          <div class="attendance-stat-card-value" style="color:#f59e0b;">
            ${currentStreak}
          </div>
          <div class="attendance-stat-card-footer">
            <span>جلسات متتالية دون غياب</span>
          </div>
        </div>
      </div>

      <!-- 3. Progress Meter & Status Guidance -->
      <div class="attendance-progress-card">
        <div class="attendance-progress-header">
          <h4 class="attendance-progress-title">مؤشر الالتزام الأكاديمي</h4>
          <span class="attendance-progress-meta text-${status === 'excellent' ? 'success' : (status === 'warning' ? 'warning' : 'danger')}">
            المستوى الحالي: ${attendanceRate}%
          </span>
        </div>

        <div class="attendance-progress-track">
          <div class="attendance-progress-fill ${status === 'excellent' ? 'success' : (status === 'warning' ? 'warning' : 'danger')}" style="width:${Math.min(100, Math.max(5, attendanceRate))}%;"></div>
          <div class="attendance-threshold-marker" title="الحد الأدنى المطلوب: 75%"></div>
        </div>

        <div class="attendance-progress-legends">
          <span>0%</span>
          <span>الحد الأدنى لاجتياز الدورة (75%)</span>
          <span>100%</span>
        </div>

        <div class="attendance-status-box ${status}">
          <span style="font-size:1.25rem;">${status === 'excellent' ? '🌟' : (status === 'warning' ? '⚠️' : '🚨')}</span>
          <span>${escapeHtml(statusMessage)}</span>
        </div>
      </div>

      <!-- 4. Attendance Session History -->
      <div class="attendance-history-card">
        <div class="attendance-toolbar">
          <div class="attendance-filter-tabs">
            <button type="button" class="attendance-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-attendance-filter="all">
              الكل (${sessions.length})
            </button>
            <button type="button" class="attendance-filter-btn ${activeFilter === 'present' ? 'active' : ''}" data-attendance-filter="present">
              حاضر (${presentCount})
            </button>
            <button type="button" class="attendance-filter-btn ${activeFilter === 'absent' ? 'active' : ''}" data-attendance-filter="absent">
              غائب (${absentCount})
            </button>
          </div>

          <div>
            <select id="attendanceSortSelect" class="attendance-sort-select" aria-label="ترتيب الجلسات">
              <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>الأحدث أولاً ⬇️</option>
              <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>الأقدم أولاً ⬆️</option>
            </select>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="attendance-table-container">
          <table class="attendance-table">
            <thead>
              <tr>
                <th scope="col">اسم المحاضرة / الجلسة</th>
                <th scope="col">تاريخ الانعقاد</th>
                <th scope="col">المجموعة</th>
                <th scope="col">حالة الحضور</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards View -->
        <div class="attendance-mobile-cards">
          ${mobileCardsHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns skeleton HTML for loading state.
 */
export function renderAttendanceSkeleton() {
  return `
    <div class="attendance-dashboard">
      <div class="attendance-header">
        <div class="attendance-title-group">
          <h2><span>📊</span> سجل الحضور والغياب</h2>
          <p>جاري تحميل بيانات حضورك الأكاديمي...</p>
        </div>
      </div>

      <div class="attendance-skeleton-grid">
        <div class="attendance-skeleton-card"></div>
        <div class="attendance-skeleton-card"></div>
        <div class="attendance-skeleton-card"></div>
        <div class="attendance-skeleton-card"></div>
      </div>

      <div class="attendance-skeleton-card" style="height:140px;"></div>
      <div class="attendance-skeleton-card" style="height:250px;"></div>
    </div>
  `;
}
