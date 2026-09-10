// src/shared/layouts/AdminLayout/admin-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Mounts the complete Admin Application Shell Layout into a root container.
 */
export function mountAdminLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-2">
        <div class="sidebar-avatar" style="width:34px;height:34px;font-size:.9rem;background:rgba(239,68,68,0.2);color:var(--color-danger);">أ</div>
        <strong id="mobileAdminName" class="text-sm">لوحة الإدارة العامة</strong>
      </div>
      <button type="button" id="mobileAdminMenuToggle" class="mobile-menu-btn" aria-label="القائمة">
        ☰
      </button>
    </header>

    <div id="mobileAdminOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar -->
      <aside id="adminSidebar" class="sidebar">
        <div class="brand">
          <div class="brand-mark">
            <img src="logo.jpeg" alt="شعار مستقبل وطن" />
          </div>
          <div class="brand-info">
            <h1>مستقبل وطن</h1>
            <p>لوحة الإدارة الرئيسية</p>
          </div>
        </div>

        <div class="sidebar-user-box">
          <div class="sidebar-avatar" id="adminSidebarAvatar" style="background:rgba(239,68,68,0.2);color:var(--color-danger);">أ</div>
          <div class="sidebar-user-info">
            <strong id="adminSidebarName">مدير النظام</strong>
            <small id="adminSidebarEmail">صلاحيات كاملة</small>
          </div>
        </div>

        <div class="sidebar-menu-title">الإدارة العامة</div>
        <nav class="sidebar-menu" id="adminSidebarNav">
          <button type="button" class="sidebar-item active" data-section="attendance">
            <span class="side-icon">📋</span>
            <span>الغياب والحضور</span>
          </button>

          <button type="button" class="sidebar-item" data-section="students">
            <span class="side-icon">👥</span>
            <span>الطلاب</span>
          </button>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon">⚙️</span>
            <span>الإعدادات</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="adminLogoutBtn">
            <span class="side-icon">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main View Area with Feature Content Slots -->
      <main class="main-view">
        <section id="sec-attendance" class="tab-content active">
          <div id="adminAttendanceContainer"></div>
        </section>

        <section id="sec-students" class="tab-content">
          <div id="adminStudentsContainer"></div>
        </section>

        <section id="sec-settings" class="tab-content">
          <div id="adminSettingsContainer"></div>
        </section>
      </main>
    </div>
  `;

  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("mobileAdminOverlay");
  const toggleBtn = document.getElementById("mobileAdminMenuToggle");
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

  document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
  });

  return {
    switchTab: setActiveTab,
    updateProfile({ name, email }) {
      const nameEl = document.getElementById("adminSidebarName");
      const emailEl = document.getElementById("adminSidebarEmail");
      if (name && nameEl) nameEl.textContent = name;
      if (email && emailEl) emailEl.textContent = email;
    }
  };
}
