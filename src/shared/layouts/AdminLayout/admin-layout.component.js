// src/shared/layouts/AdminLayout/admin-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";
import { renderAvatar } from "../../components/Avatar/avatar.component.js";
import { renderBadge } from "../../components/Badge/badge.component.js";

/**
 * Mounts the complete Admin Application Shell Layout into a root container.
 */
export function mountAdminLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-3">
        <div class="brand-mark" style="width:36px;height:36px;">
          <img src="logo.jpeg" alt="شعار مستقبل وطن" />
        </div>
        <div>
          <strong id="mobileAdminName" class="text-sm d-block font-extrabold">الإدارة العامة</strong>
          <span class="text-xs text-muted">صلاحيات كاملة</span>
        </div>
      </div>
      <button type="button" id="mobileAdminMenuToggle" class="mobile-menu-btn" aria-label="فتح القائمة">
        ☰
      </button>
    </header>

    <div id="mobileAdminOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar -->
      <aside id="adminSidebar" class="sidebar" aria-label="القائمة الجانبية للمدير">
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
          <div id="adminAvatarSlot">
            ${renderAvatar({ name: "أ", size: "md", className: "bg-danger text-inverse" })}
          </div>
          <div class="sidebar-user-info">
            <strong id="adminSidebarName">مدير النظام</strong>
            <small id="adminSidebarEmail">صلاحيات كاملة</small>
          </div>
        </div>

        <div class="sidebar-menu-title">الإشراف والإدارة</div>
        <nav class="sidebar-menu" id="adminSidebarNav" role="navigation">
          <button type="button" class="sidebar-item active" data-section="attendance">
            <span class="side-icon" aria-hidden="true">📊</span>
            <span>الغياب والحضور العام</span>
          </button>

          <button type="button" class="sidebar-item" data-section="students">
            <span class="side-icon" aria-hidden="true">👥</span>
            <span>إدارة شؤون الطلاب</span>
          </button>

          <div class="sidebar-menu-title">النظام العام</div>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon" aria-hidden="true">⚙️</span>
            <span>إعدادات النظام والمظهر</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="adminLogoutBtn">
            <span class="side-icon" aria-hidden="true">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Desktop Topbar -->
        <header class="topbar">
          <div class="topbar-breadcrumb">
            <span>لوحة الإدارة</span>
            <span>/</span>
            <strong id="adminTopbarCurrentTab">📊 الغياب والحضور العام</strong>
          </div>
          <div class="topbar-actions">
            ${renderBadge({ text: "مدير النظام", variant: "danger", icon: "🛡️" })}
            <div id="adminTopbarUserInitial" class="avatar avatar-sm">أ</div>
          </div>
        </header>

        <main class="main-view" role="main">
          <section id="sec-attendance" class="tab-content active" aria-labelledby="heading-a-attendance">
            <div class="page-header">
              <div>
                <h2 id="heading-a-attendance" class="page-title">📊 إدارة الغياب والحضور العام</h2>
                <p class="page-subtitle">تسجيل الحضور المركزي لجميع المجموعات ومتابعة السجلات التاريخية.</p>
              </div>
            </div>
            <div id="adminAttendanceContainer"></div>
          </section>

          <section id="sec-students" class="tab-content" aria-labelledby="heading-a-students">
            <div class="page-header">
              <div>
                <h2 id="heading-a-students" class="page-title">👥 الإدارة الشاملة للطلاب</h2>
                <p class="page-subtitle">إضافة وتعديل وحذف الطلاب، البحث والفلترة وتوليد بيانات الدخول.</p>
              </div>
            </div>
            <div id="adminStudentsContainer"></div>
          </section>

          <section id="sec-settings" class="tab-content" aria-labelledby="heading-a-settings">
            <div class="page-header">
              <div>
                <h2 id="heading-a-settings" class="page-title">⚙️ إعدادات النظام وتخصيص المظهر</h2>
                <p class="page-subtitle">تعديل سمة الألوان للمنصة، حجم الخط، واللغة المفضلة.</p>
              </div>
            </div>
            <div id="adminSettingsContainer"></div>
          </section>
        </main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("mobileAdminOverlay");
  const toggleBtn = document.getElementById("mobileAdminMenuToggle");
  const navItems = container.querySelectorAll(".sidebar-item[data-section]");
  const topbarBreadcrumb = document.getElementById("adminTopbarCurrentTab");

  const tabLabels = {
    attendance: "📊 الغياب والحضور العام",
    students: "👥 إدارة شؤون الطلاب",
    settings: "⚙️ إعدادات النظام والمظهر"
  };

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

    if (topbarBreadcrumb && tabLabels[sectionId]) {
      topbarBreadcrumb.textContent = tabLabels[sectionId];
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
      const avatarSlot = document.getElementById("adminAvatarSlot");
      const topbarAvatar = document.getElementById("adminTopbarUserInitial");

      if (name) {
        if (nameEl) nameEl.textContent = name;
        if (avatarSlot) avatarSlot.innerHTML = renderAvatar({ name, size: "md" });
        if (topbarAvatar) topbarAvatar.textContent = name.trim().charAt(0);
      }
      if (email && emailEl) {
        emailEl.textContent = email;
      }
    }
  };
}
