// src/shared/layouts/TeacherLayout/teacher-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Mounts the complete Teacher Application Shell Layout into a root container.
 */
export function mountTeacherLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-2">
        <div class="sidebar-avatar" style="width:34px;height:34px;font-size:.9rem;background:rgba(216,173,85,0.2);color:var(--gold);">م</div>
        <strong id="mobileTeacherName" class="text-sm">لوحة المعلم</strong>
      </div>
      <button type="button" id="mobileTeacherMenuToggle" class="mobile-menu-btn" aria-label="القائمة">
        ☰
      </button>
    </header>

    <div id="mobileTeacherOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar -->
      <aside id="teacherSidebar" class="sidebar">
        <div class="brand">
          <div class="brand-mark">
            <img src="logo.jpeg" alt="شعار مستقبل وطن" />
          </div>
          <div class="brand-info">
            <h1>مستقبل وطن</h1>
            <p>لوحة التحكم التعليمية</p>
          </div>
        </div>

        <div class="sidebar-user-box">
          <div class="sidebar-avatar" id="teacherSidebarAvatar" style="background:rgba(216,173,85,0.2);color:var(--gold);">م</div>
          <div class="sidebar-user-info">
            <strong id="teacherSidebarName">المعلم</strong>
            <small id="teacherSidebarEmail">إدارة الكورس</small>
          </div>
        </div>

        <div class="sidebar-menu-title">الإدارة والأقسام</div>
        <nav class="sidebar-menu" id="teacherSidebarNav">
          <button type="button" class="sidebar-item active" data-section="data">
            <span class="side-icon">📚</span>
            <span>الداتا والدروس</span>
          </button>

          <button type="button" class="sidebar-item" data-section="exams">
            <span class="side-icon">📝</span>
            <span>الامتحانات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="assignments">
            <span class="side-icon">📋</span>
            <span>التاسكات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="students">
            <span class="side-icon">👥</span>
            <span>الطلاب</span>
          </button>

          <button type="button" class="sidebar-item" data-section="attendance">
            <span class="side-icon">📋</span>
            <span>الغياب والحضور</span>
          </button>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon">⚙️</span>
            <span>الإعدادات</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="teacherLogoutBtn">
            <span class="side-icon">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main View Area with Feature Content Slots -->
      <main class="main-view">
        <section id="sec-data" class="tab-content active">
          <div id="teacherDataContainer"></div>
        </section>

        <section id="sec-exams" class="tab-content">
          <div id="teacherExamsContainer"></div>
        </section>

        <section id="sec-assignments" class="tab-content">
          <div id="teacherAssignmentsContainer"></div>
        </section>

        <section id="sec-students" class="tab-content">
          <div id="teacherStudentsContainer"></div>
        </section>

        <section id="sec-attendance" class="tab-content">
          <div id="teacherAttendanceContainer"></div>
        </section>

        <section id="sec-settings" class="tab-content">
          <div id="teacherSettingsContainer"></div>
        </section>
      </main>
    </div>
  `;

  const sidebar = document.getElementById("teacherSidebar");
  const overlay = document.getElementById("mobileTeacherOverlay");
  const toggleBtn = document.getElementById("mobileTeacherMenuToggle");
  const navItems = container.querySelectorAll(".sidebar-item[data-section]");

  function closeMobile() {
    sidebar?.classList.remove("mobile-open");
    overlay?.classList.remove("active");
  }

  toggleBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("mobile-open");
    overlay?.classList.toggle("active");
  });

  overlay?.addEventListener("click", closeMobile);

  function setActiveTab(sectionId) {
    navItems.forEach((btn) => {
      const match = btn.getAttribute("data-section") === sectionId;
      btn.classList.toggle("active", match);
    });

    const allSections = container.querySelectorAll(".tab-content");
    allSections.forEach((sec) => sec.classList.remove("active"));

    const target = document.getElementById(`sec-${sectionId}`);
    if (target) {
      target.classList.add("active");
    }

    closeMobile();
    if (typeof onTabChange === "function") {
      onTabChange(sectionId);
    }
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      setActiveTab(section);
    });
  });

  document.getElementById("teacherLogoutBtn")?.addEventListener("click", () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
  });

  return {
    switchTab: setActiveTab,
    updateProfile({ name, email }) {
      const nameEl = document.getElementById("teacherSidebarName");
      const emailEl = document.getElementById("teacherSidebarEmail");
      if (name && nameEl) nameEl.textContent = name;
      if (email && emailEl) emailEl.textContent = email;
    }
  };
}
