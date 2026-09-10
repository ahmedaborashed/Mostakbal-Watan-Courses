// src/shared/layouts/StudentLayout/student-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Mounts the complete Student Application Shell Layout into a root container.
 */
export function mountStudentLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-2">
        <div class="sidebar-avatar" style="width:34px;height:34px;font-size:.9rem;">ط</div>
        <strong id="mobileStudentName" class="text-sm">الطالب</strong>
      </div>
      <button type="button" id="mobileMenuToggle" class="mobile-menu-btn" aria-label="القائمة">
        ☰
      </button>
    </header>

    <div id="mobileOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar -->
      <aside id="appSidebar" class="sidebar">
        <div class="brand">
          <div class="brand-mark">
            <img src="logo.jpeg" alt="شعار مستقبل وطن" />
          </div>
          <div class="brand-info">
            <h1>مستقبل وطن</h1>
            <p>منصة التعليم الرقمية</p>
          </div>
        </div>

        <div class="sidebar-user-box">
          <div class="sidebar-avatar" id="sidebarAvatar">ط</div>
          <div class="sidebar-user-info">
            <strong id="sidebarName">الطالب</strong>
            <small id="sidebarPhone">—</small>
          </div>
        </div>

        <div class="sidebar-menu-title">القائمة الرئيسية</div>
        <nav class="sidebar-menu" id="sidebarNav">
          <button type="button" class="sidebar-item active" data-section="videos">
            <span class="side-icon">📚</span>
            <span>الداتا</span>
          </button>

          <button type="button" class="sidebar-item" data-section="exams">
            <span class="side-icon">📝</span>
            <span>الامتحانات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="tasks">
            <span class="side-icon">📋</span>
            <span>التاسكات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="attendance">
            <span class="side-icon">📊</span>
            <span>الغياب والحضور</span>
          </button>

          <button type="button" class="sidebar-item" data-section="profile">
            <span class="side-icon">👤</span>
            <span>حسابي</span>
          </button>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon">⚙️</span>
            <span>الإعدادات</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="sidebarLogoutBtn">
            <span class="side-icon">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main View Area with Feature Content Slots -->
      <main class="main-view">
        <section id="sec-videos" class="tab-content active">
          <div class="page-header">
            <h2 class="page-title">📚 الداتا والدروس</h2>
          </div>
          <div id="videoListContainer"></div>
        </section>

        <section id="sec-exams" class="tab-content">
          <div class="page-header">
            <h2 class="page-title">📝 الامتحانات</h2>
          </div>
          <div id="examListContainer"></div>
          <div id="activeExamContainer" class="d-none"></div>
        </section>

        <section id="sec-tasks" class="tab-content">
          <div class="page-header">
            <h2 class="page-title">📋 التاسكات والواجبات</h2>
          </div>
          <div id="taskListContainer"></div>
        </section>

        <section id="sec-attendance" class="tab-content">
          <div class="page-header">
            <h2 class="page-title">📊 الغياب والحضور</h2>
          </div>
          <div id="attendanceContainer"></div>
        </section>

        <section id="sec-profile" class="tab-content">
          <div class="page-header">
            <h2 class="page-title">👤 حسابي الشخصي</h2>
          </div>
          <div id="profileContainer"></div>
        </section>

        <section id="sec-settings" class="tab-content">
          <div class="page-header">
            <h2 class="page-title">⚙️ الإعدادات</h2>
          </div>
          <div id="settingsContainer"></div>
        </section>
      </main>
    </div>
  `;

  // Wire up sidebar switching
  const sidebar = document.getElementById("appSidebar");
  const overlay = document.getElementById("mobileOverlay");
  const toggleBtn = document.getElementById("mobileMenuToggle");
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

  document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
  });

  return {
    switchTab: setActiveTab,
    updateProfile({ name, phone }) {
      const nameEl = document.getElementById("sidebarName");
      const phoneEl = document.getElementById("sidebarPhone");
      const mobileNameEl = document.getElementById("mobileStudentName");
      const avatarEl = document.getElementById("sidebarAvatar");

      if (name) {
        if (nameEl) nameEl.textContent = name;
        if (mobileNameEl) mobileNameEl.textContent = name;
        if (avatarEl) avatarEl.textContent = name.trim().charAt(0);
      }
      if (phone && phoneEl) {
        phoneEl.textContent = phone;
      }
    }
  };
}
