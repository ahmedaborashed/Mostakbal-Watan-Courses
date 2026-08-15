import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔥 loading function
function startLoading(redirectPage) {
  const loadingScreen = document.getElementById("loadingScreen");
  const countText = document.getElementById("loadingCount");

  let time = 5;

  // اقفل الفورم
  document.getElementById("login").style.display = "none";

  // افتح شاشة اللودينج
  loadingScreen.style.display = "flex";

  countText.innerText = time;

  const interval = setInterval(() => {
    time--;
    countText.innerText = time;

    if (time <= 0) {
      clearInterval(interval);
      window.location.href = redirectPage;
    }
  }, 1000);
}

window.openContactOptions = function(){
  document.getElementById("contactModal").classList.add("show");
};

window.closeContactOptions = function(){
  document.getElementById("contactModal").classList.remove("show");
};

window.addEventListener("click", function(e){
  const modal = document.getElementById("contactModal");

  if(e.target === modal){
    closeContactOptions();
  }
});

// 🔐 login الرئيسي
window.login = async () => {

  let usernameInput = document.getElementById("loginUsername").value.trim();
  let passwordInput = document.getElementById("loginPassword").value.trim();

  if(!usernameInput || !passwordInput){
    alert("ادخل البيانات ❗");
    return;
  }

  // 🔐 نجرب الأول الإداري
  let adminEmail = usernameInput + "@admin.local";

  try {
    await signInWithEmailAndPassword(auth, adminEmail, passwordInput);

    // لو نجح → Admin
    startLoading("admin.html");
    return;

  } catch (adminErr) {
    // مش إداري → نكمل ونحاول مدرس
  }

  // 🔥 نجرب Teacher ثم Student
  let teacherEmail = usernameInput + "@system.local";
  let studentEmail = usernameInput + "@student.local";

  try {

    // 👨‍🏫 نحاول كمدرس
    await signInWithEmailAndPassword(auth, teacherEmail, passwordInput);

    startLoading("teacher.html");
    return;

  } catch (err1) {

    try {

      // 👨‍🎓 نحاول كطالب
      await signInWithEmailAndPassword(auth, studentEmail, passwordInput);

      startLoading("student.html");
      return;

    } catch (err2) {

      alert("بيانات غلط ❌");
      console.error(err2);

    }
  }
};