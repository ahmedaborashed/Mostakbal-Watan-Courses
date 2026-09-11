import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export function protectPage(requiredRole = null) {

  onAuthStateChanged(auth, (user) => {

    // ❌ مش عامل login
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // 🔥 لو في role مطلوب
    if (requiredRole === "teacher" && !user.email.endsWith("@system.local")) {
      alert("غير مسموح 🚫");
      window.location.href = "index.html";
    }

    if (requiredRole === "student" && !user.email.endsWith("@student.local")) {
      alert("غير مسموح 🚫");
      window.location.href = "index.html";
    }

  });

}