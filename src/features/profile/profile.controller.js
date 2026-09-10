// src/features/profile/profile.controller.js
import { ProfileService } from "./profile.service.js";
import { profileState } from "./profile.state.js";
import { renderProfileCard } from "./components/profile-card.component.js";
import { renderThemePickerView } from "./components/theme-picker.component.js";
import { renderModal, openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderInput } from "../../shared/components/Input/input.component.js";
import { renderButton } from "../../shared/components/Button/button.component.js";
import { validatePasswordChange } from "../../shared/validators/auth.validator.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const ProfileController = {
  /**
   * Loads and renders student profile card.
   */
  loadProfileView(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    // Inject change password modal if not present
    if (!document.getElementById("userChangePasswordModal")) {
      const modalHtml = renderModal({
        id: "userChangePasswordModal",
        title: "🔐 تغيير كلمة المرور",
        bodyHtml: `
          <form id="userChangePasswordForm" onsubmit="return false;">
            ${renderInput({
              id: "profileNewPassword",
              type: "password",
              label: "كلمة المرور الجديدة",
              placeholder: "6 أحرف أو أرقام على الأقل",
              required: true
            })}
            ${renderInput({
              id: "profileConfirmPassword",
              type: "password",
              label: "تأكيد كلمة المرور الجديدة",
              placeholder: "أعد كتابة كلمة المرور",
              required: true
            })}
            <div class="mt-6">
              ${renderButton({
                id: "submitUserPasswordBtn",
                text: "تأكيد تغيير كلمة المرور 🔐",
                type: "submit",
                variant: "primary",
                className: "w-full btn-lg"
              })}
            </div>
          </form>
        `
      });
      document.body.insertAdjacentHTML("beforeend", modalHtml);
      this.bindPasswordForm();
    }

    setHtml(container, renderProfileCard({ student: currentStudent }));

    document.getElementById("openChangePasswordModalBtn")?.addEventListener("click", () => {
      openModal("userChangePasswordModal");
    });
  },

  /**
   * Loads and renders theme and system settings.
   */
  loadSettingsView(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    const currentTheme = profileState.get("theme");
    const currentFont = profileState.get("fontScale");
    const currentLang = profileState.get("language");

    setHtml(container, renderThemePickerView({ currentTheme, currentFont, currentLang }));

    // Bind theme choice buttons
    container.querySelectorAll("[data-theme-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.getAttribute("data-theme-choice");
        ProfileService.applyTheme(theme);
        profileState.set("theme", theme);
        this.loadSettingsView(container);
        showToast(`تم تطبيق السمة اللونية الجديدة بنجاح 🎨`, "success");
      });
    });

    // Bind font buttons
    document.getElementById("fontDecBtn")?.addEventListener("click", () => {
      const newScale = ProfileService.applyFontScale(-1);
      profileState.set("fontScale", newScale);
      const disp = document.getElementById("fontScaleDisplay");
      if (disp) disp.textContent = `${newScale}%`;
    });

    document.getElementById("fontIncBtn")?.addEventListener("click", () => {
      const newScale = ProfileService.applyFontScale(1);
      profileState.set("fontScale", newScale);
      const disp = document.getElementById("fontScaleDisplay");
      if (disp) disp.textContent = `${newScale}%`;
    });

    // Bind language select
    document.getElementById("platformLanguageSelect")?.addEventListener("change", (e) => {
      const selected = e.target.value;
      ProfileService.applyLanguage(selected);
      profileState.set("language", selected);
      showToast(`تم ضبط لغة المنصة: ${selected === "ar" ? "العربية" : "English"} 🌐`, "info");
    });
  },

  /**
   * Binds change password form submission.
   */
  bindPasswordForm() {
    const form = document.getElementById("userChangePasswordForm");
    form?.addEventListener("submit", async () => {
      const newPass = document.getElementById("profileNewPassword")?.value || "";
      const confirmPass = document.getElementById("profileConfirmPassword")?.value || "";

      try {
        validatePasswordChange(newPass, confirmPass);
      } catch (validationErr) {
        showToast(validationErr.message, "warning");
        return;
      }

      const submitBtn = document.getElementById("submitUserPasswordBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        submitBtn.innerText = "جاري تحديث كلمة المرور... ⏳";
      }

      try {
        await ProfileService.updatePassword(newPass);
        showToast("تم تحديث كلمة المرور بنجاح ✅", "success");
        closeModal("userChangePasswordModal");
        form.reset();
      } catch (err) {
        console.error("Password change failed:", err);
        showToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          submitBtn.innerText = "تأكيد تغيير كلمة المرور 🔐";
        }
      }
    });
  }
};
