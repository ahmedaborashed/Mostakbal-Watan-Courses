// src/features/auth/components/login-modal.component.js
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderInput, renderPasswordInput } from "../../../shared/components/Input/input.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";

export function renderLoginModal() {
  const bodyHtml = `
    <form id="loginForm" onsubmit="return false;">
      ${renderInput({
        id: "loginUsername",
        name: "username",
        label: "اسم المستخدم / رقم الهاتف",
        placeholder: "010xxxxxxxx أو اسم المستخدم",
        required: true
      })}

      ${renderPasswordInput({
        id: "loginPassword",
        name: "password",
        label: "كلمة المرور",
        placeholder: "••••••••",
        required: true
      })}

      <div id="loginErrorMsg" class="form-error d-none mb-3"></div>

      <div class="mt-4">
        ${renderButton({
          id: "submitLoginBtn",
          text: "تسجيل الدخول 🚀",
          type: "submit",
          variant: "primary",
          className: "w-full btn-lg"
        })}
      </div>
    </form>
  `;

  return renderModal({
    id: "loginModal",
    title: "🔐 تسجيل الدخول",
    bodyHtml
  });
}
