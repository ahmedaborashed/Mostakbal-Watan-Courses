import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApPZ9oXNJYzh-qYb2aZDa3FHpBGssGSng",
  authDomain: "tesla-5fdef.firebaseapp.com",
  projectId: "tesla-5fdef",
  storageBucket: "tesla-5fdef.firebasestorage.app",
  appId: "1:182301672992:web:24a81dc3057555a4191e45"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);