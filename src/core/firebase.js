// src/core/firebase.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyApPZ9oXNJYzh-qYb2aZDa3FHpBGssGSng",
  authDomain: "tesla-5fdef.firebaseapp.com",
  projectId: "tesla-5fdef",
  storageBucket: "tesla-5fdef.firebasestorage.app",
  appId: "1:182301672992:web:24a81dc3057555a4191e45"
};

// Singleton initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "europe-west1");

export { httpsCallable };
export default app;
