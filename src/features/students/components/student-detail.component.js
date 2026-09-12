// src/features/students/components/student-detail.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { formatDate } from "../../../shared/utils/date.utils.js";
import { normalizeAssignmentGrade } from "../../assignments/assignment.service.js";

/**
 * Returns the HTML for the Student 360 Detail modal shell.
 */
export function renderStudentDetailModal() {
  const bodyHtml = `<div id="studentDetailBody" class="p-2"><div class="spinner"></div></div>`;
  return renderModal({
    id: "studentDetailModal",
    title: "👤 ملف الطالب الشامل 360° (Student 360° Dossier)",
    bodyHtml,
    maxWidth: "880px"
  });
}

/**
 * Returns HTML content for the complete Student 360 dossier body.
 * @param {object} data360 - Aggregated student 360 record
 * @param {object} [options]
 * @param {boolean} [options.canDelete=false]
 * @returns {string} HTML
 */
export function renderStudent360Content(data360, { canDelete = false } = {}) {
  const { student = {}, exams = [], assignments = [], attendance = {}, gamification = {} } = data360 || {};

  const uid = student.id || student.firestoreId || "";
  const name = student.studentName || student.name || "طالب غير محدد";
  const phone = student.studentPhone || student.phone || "—";
  const nationalId = student.nationalId || student.studentNationalId || "—";
  const address = student.address || student.studentAddress || "—";
  const group = student.studentGroup || student.group || "ALL";
  const regDate = student.createdAt ? formatDate(student.createdAt) : "—";
  const accountStatus = student.active === false ? "معطل" : "نشط";

  // Attendance metrics
  const totalHeld = attendance.totalSessions || 0;
  const presentCount = attendance.presentCount || 0;
  const absentCount = attendance.absentCount || 0;
  const attRate = attendance.attendanceRate != null ? attendance.attendanceRate : 100;
  const isHighAbsence = absentCount >= 4;

  return `
    <div class="student-360-view" dir="rtl">
      <!-- 1. Top Header Profile Card -->
      <div class="card p-4 mb-4" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between flex-wrap gap-3">
          <div class="d-flex items-center gap-3">
            ${renderAvatar({ name, size: "lg" })}
            <div>
              <div class="d-flex items-center gap-2 flex-wrap mb-1">
                <h3 class="font-black m-0" style="font-size:1.3rem;color:var(--color-text-primary);">${escapeHtml(name)}</h3>
                ${renderBadge({ text: group, variant: "gold", className: "font-bold text-xs" })}
                <span class="badge ${student.active === false ? 'badge-danger' : 'badge-success'} text-xs font-bold">${accountStatus}</span>
                ${
                  isHighAbsence
                    ? `<span class="badge badge-danger text-xs font-bold">🔴 ${absentCount} غيابات (إنذار غياب مرتفع)</span>`
                    : ""
                }
              </div>
              <div class="text-xs text-muted font-mono" style="direction:ltr;text-align:right;">
                📱 ${escapeHtml(phone)} · 🆔 ${escapeHtml(nationalId)}
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="d-flex items-center gap-2 flex-wrap">
            ${renderButton({
              text: "✏️ تعديل البيانات",
              variant: "primary",
              size: "sm",
              extraAttrs: `data-detail-edit-student="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
            })}
            ${renderButton({
              text: "🔑 كلمة المرور",
              variant: "secondary",
              size: "sm",
              extraAttrs: `data-detail-reset-pass="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
            })}
            ${
              canDelete
                ? renderButton({
                    text: "🗑️ حذف الحساب",
                    variant: "danger",
                    size: "sm",
                    extraAttrs: `data-detail-delete-student="${escapeHtml(uid)}" data-student-name="${escapeHtml(name)}"`
                  })
                : ""
            }
          </div>
        </div>
      </div>

      <!-- 2. Segmented Navigation Tabs -->
      <div class="academic-filter-tabs mb-4" style="margin-inline:0;">
        <button type="button" class="academic-filter-btn active" data-s360-tab="overview">
          <span>👤 البيانات العامة</span>
        </button>
        <button type="button" class="academic-filter-btn" data-s360-tab="exams">
          <span>📝 الامتحانات (${exams.length})</span>
        </button>
        <button type="button" class="academic-filter-btn" data-s360-tab="assignments">
          <span>📚 التاسكات (${assignments.length})</span>
        </button>
        <button type="button" class="academic-filter-btn" data-s360-tab="attendance">
          <span>📊 الحضور (${attRate}%)</span>
        </button>
        <button type="button" class="academic-filter-btn" data-s360-tab="game">
          <span>🐍 Python Adventure</span>
        </button>
      </div>

      <!-- 3. Tab Contents -->

      <!-- TAB 1: OVERVIEW & PERSONAL INFO -->
      <div id="s360TabOverview" class="s360-tab-pane">
        <div class="grid-2 gap-3 mb-4">
          <div class="card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);">
            <div class="text-xs text-muted mb-1">الرقم القومي:</div>
            <strong class="font-mono text-sm" style="color:var(--color-text-primary);">${escapeHtml(nationalId)}</strong>
          </div>
          <div class="card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);">
            <div class="text-xs text-muted mb-1">رقم الهاتف (اسم المستخدم):</div>
            <strong class="font-mono text-sm" style="direction:ltr;display:inline-block;color:var(--color-text-primary);">${escapeHtml(phone)}</strong>
          </div>
          <div class="card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);">
            <div class="text-xs text-muted mb-1">المجموعة الدراسية:</div>
            <strong class="text-sm text-primary">${escapeHtml(group)}</strong>
          </div>
          <div class="card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);">
            <div class="text-xs text-muted mb-1">تاريخ التسجيل بالمنصة:</div>
            <strong class="text-sm" style="color:var(--color-text-primary);">${escapeHtml(regDate)}</strong>
          </div>
          <div class="card p-3" style="grid-column:span 2;background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);">
            <div class="text-xs text-muted mb-1">العنوان ومحل الإقامة:</div>
            <strong class="text-sm" style="color:var(--color-text-primary);">${escapeHtml(address)}</strong>
          </div>
        </div>
      </div>

      <!-- TAB 2: EXAMS HISTORY -->
      <div id="s360TabExams" class="s360-tab-pane" style="display:none;">
        <div class="table-wrapper" style="border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);overflow-x:auto;">
          <table class="table-modern w-full" style="font-size:var(--font-size-xs);">
            <thead>
              <tr>
                <th scope="col" style="width:35px;text-align:center;">#</th>
                <th scope="col">الامتحان</th>
                <th scope="col">التاريخ</th>
                <th scope="col" style="text-align:center;">الدرجة</th>
                <th scope="col" style="text-align:center;">النسبة</th>
                <th scope="col" style="text-align:center;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${
                exams.length === 0
                  ? `<tr><td colspan="6" class="text-center p-4 text-muted">لم يقم هذا الطالب بتقديم أي امتحانات بعد.</td></tr>`
                  : exams
                      .map((ex, idx) => {
                        const isPendingEssay = ex.status === "pending_essay";
                        const isPassed = ex.percentage >= 50;
                        const statusBadge = isPendingEssay
                          ? `<span class="badge badge-warning text-xs font-bold">قيد تصحيح المقالي ⏳</span>`
                          : isPassed
                          ? `<span class="badge badge-success text-xs font-bold">ناجح ✓</span>`
                          : `<span class="badge badge-danger text-xs font-bold">راسب</span>`;

                        return `
                          <tr>
                            <td style="text-align:center;">${idx + 1}</td>
                            <td><strong style="color:var(--color-text-primary);">${escapeHtml(ex.examTitle)}</strong></td>
                            <td>${ex.date ? formatDate(ex.date) : "—"}</td>
                            <td style="text-align:center;">
                              <strong class="text-accent font-black">${ex.score}</strong>
                              <span class="text-muted"> / ${ex.total}</span>
                            </td>
                            <td style="text-align:center;font-weight:bold;" class="${ex.percentage >= 50 ? 'text-success' : 'text-danger'}">
                              ${ex.percentage}%
                            </td>
                            <td style="text-align:center;">${statusBadge}</td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: ASSIGNMENTS HISTORY -->
      <div id="s360TabAssignments" class="s360-tab-pane" style="display:none;">
        <div class="table-wrapper" style="border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);overflow-x:auto;">
          <table class="table-modern w-full" style="font-size:var(--font-size-xs);">
            <thead>
              <tr>
                <th scope="col" style="width:35px;text-align:center;">#</th>
                <th scope="col">الواجب</th>
                <th scope="col">تاريخ التسليم</th>
                <th scope="col" style="text-align:center;">الحل / الملف</th>
                <th scope="col" style="text-align:center;">الدرجة</th>
                <th scope="col">ملاحظات المعلم</th>
              </tr>
            </thead>
            <tbody>
              ${
                assignments.length === 0
                  ? `<tr><td colspan="6" class="text-center p-4 text-muted">لا توجد تسليمات واجبات مسجلة لهذا الطالب.</td></tr>`
                  : assignments
                      .map((task, idx) => {
                        const fileBtn = task.fileUrl
                          ? `<a href="${escapeHtml(task.fileUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-xs">ملف 📥</a>`
                          : "";
                        const rawAnswer = (task.answerText || task.answer || task.code || task.solution || task.content || task.text || "").trim();
                        const textBadge = rawAnswer
                          ? `<span class="badge badge-neutral text-xs" title="${escapeHtml(rawAnswer.slice(0, 200))}">نص / كود 📝</span>`
                          : "";

                        const normGrade = normalizeAssignmentGrade(task.grade);

                        return `
                          <tr>
                            <td style="text-align:center;">${idx + 1}</td>
                            <td><strong style="color:var(--color-text-primary);">${escapeHtml(task.assignmentTitle)}</strong></td>
                            <td>${task.submittedAt ? formatDate(task.submittedAt) : "—"}</td>
                            <td style="text-align:center;">${fileBtn} ${textBadge}</td>
                            <td style="text-align:center;">
                              ${
                                normGrade !== null
                                  ? `<strong class="text-accent font-black" style="font-size:0.95rem;">${normGrade} / 10</strong>`
                                  : `<span class="badge badge-warning text-xs font-bold">قيد التقييم</span>`
                              }
                            </td>
                            <td>
                              <span class="text-xs text-muted">${task.feedback ? escapeHtml(task.feedback) : "—"}</span>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: ATTENDANCE & SESSIONS -->
      <div id="s360TabAttendance" class="s360-tab-pane" style="display:none;">
        <!-- KPI Metrics -->
        <div class="grid-4 gap-2 mb-4">
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">إجمالي الجلسات</span>
            <span class="stat-value font-black text-primary" style="font-size:1.3rem;">${totalHeld}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">✅ الحضور</span>
            <span class="stat-value font-black text-success" style="font-size:1.3rem;">${presentCount}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">❌ الغياب</span>
            <span class="stat-value font-black text-danger" style="font-size:1.3rem;">${absentCount}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">نسبة الحضور</span>
            <span class="stat-value font-black ${attRate >= 75 ? 'text-success' : 'text-danger'}" style="font-size:1.3rem;">${attRate}%</span>
          </div>
        </div>

        <!-- Attended & Absent Sessions Breakdown -->
        <div class="grid-2 gap-4">
          <!-- Attended Sessions List -->
          <div class="card p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-subtle);">
            <h5 class="font-black text-xs text-success mb-2">
              ✅ الجلسات التي حضرها الطالب (${(attendance.attendedSessions || []).length}):
            </h5>
            <div class="d-flex flex-col gap-1" style="max-height:200px;overflow-y:auto;">
              ${
                (attendance.attendedSessions || []).length === 0
                  ? `<div class="text-muted text-xs p-2">لا توجد جلسات حضور مسجلة.</div>`
                  : (attendance.attendedSessions || [])
                      .map(
                        (s) => `
                    <div class="p-2 d-flex items-center justify-between text-xs" style="border-bottom:1px solid var(--color-border-subtle);">
                      <span>${escapeHtml(s.name || s.title || s.sessionTitle || "جلسة")}</span>
                      <span class="text-muted font-mono">${s.date || s.sessionDate || "—"}</span>
                    </div>
                  `
                      )
                      .join("")
              }
            </div>
          </div>

          <!-- Absent Sessions List -->
          <div class="card p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-subtle);">
            <h5 class="font-black text-xs text-danger mb-2">
              ❌ الجلسات التي تغيب عنها الطالب (${(attendance.absentSessions || []).length}):
            </h5>
            <div class="d-flex flex-col gap-1" style="max-height:200px;overflow-y:auto;">
              ${
                (attendance.absentSessions || []).length === 0
                  ? `<div class="text-muted text-xs p-2">رائع! لم يتغيب الطالب عن أي جلسة.</div>`
                  : (attendance.absentSessions || [])
                      .map(
                        (s) => `
                    <div class="p-2 d-flex items-center justify-between text-xs" style="border-bottom:1px solid var(--color-border-subtle);">
                      <span class="text-danger font-bold">${escapeHtml(s.name || s.title || s.sessionTitle || "جلسة")}</span>
                      <span class="text-muted font-mono">${s.date || s.sessionDate || "—"}</span>
                    </div>
                  `
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: PYTHON ADVENTURE & GAMIFICATION -->
      <div id="s360TabGame" class="s360-tab-pane" style="display:none;">
        <div class="grid-4 gap-2 mb-4">
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">🌟 المستوى الأكاديمي</span>
            <span class="stat-value font-black text-primary" style="font-size:1.3rem;">Lv. ${gamification.level || 1}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">⚡ نقاط الخبرة (XP)</span>
            <span class="stat-value font-black text-accent" style="font-size:1.3rem;">${gamification.xp || 0}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">🏆 نقاط المسابقات</span>
            <span class="stat-value font-black text-success" style="font-size:1.3rem;">${gamification.competitionPoints || 0}</span>
          </div>
          <div class="stat-card p-3" style="background:var(--color-bg-secondary);border:1px solid var(--color-border-subtle);border-radius:var(--radius-sm);flex-direction:column;gap:0.2rem;">
            <span class="stat-label text-xs">🧩 التحديات المنجزة</span>
            <span class="stat-value font-black text-info" style="font-size:1.3rem;">${gamification.completedChallengesCount || 0}</span>
          </div>
        </div>

        <!-- Achievements Badges -->
        <div class="card p-3" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-subtle);">
          <h5 class="font-bold text-xs text-muted mb-2">🏅 الإنجازات المفتوحة (Achievements):</h5>
          <div class="d-flex items-center gap-2 flex-wrap">
            ${
              (gamification.achievements || []).length === 0
                ? `<span class="text-xs text-muted p-2">لم يفتح الطالب أي أوسمة أو إنجازات بعد.</span>`
                : (gamification.achievements || [])
                    .map((a) => {
                      const title = typeof a === "string" ? a : (a.title || a.id);
                      return `<span class="badge badge-gold text-xs font-bold">🏅 ${escapeHtml(title)}</span>`;
                    })
                    .join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Backwards compatibility fallback function.
 */
export function renderStudentDetailContent(student, options = {}) {
  return renderStudent360Content({ student }, options);
}
