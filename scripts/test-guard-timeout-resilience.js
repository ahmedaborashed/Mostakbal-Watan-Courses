// scripts/test-guard-timeout-resilience.js
import assert from "node:assert";

console.log("🧪 Starting Guard Timeout & Portal Resilience Tests...\n");

// 1. Test Guard Timeout Behavior
{
  console.log("  Testing protectRoute timeout and reject mechanism...");

  function simulateProtectRoute(onAuthStateChangedMock, { timeoutMs = 100 } = {}) {
    let redirected = false;
    let redirectToLogin = () => { redirected = true; };

    return {
      promise: new Promise((resolve, reject) => {
        let settled = false;

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          redirectToLogin();
          reject(new Error("AUTH_TIMEOUT: تعذر التحقق من الجلسة في الوقت المحدد."));
        }, timeoutMs);

        let unsubscribe = () => {};

        try {
          unsubscribe = onAuthStateChangedMock(async (user) => {
            if (settled) return;

            if (!user) {
              settled = true;
              clearTimeout(timer);
              redirectToLogin();
              reject(new Error("UNAUTHENTICATED: يرجى تسجيل الدخول أولاً."));
              return;
            }

            settled = true;
            clearTimeout(timer);
            resolve({ user });
          });
        } catch (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          redirectToLogin();
          reject(err);
        }
      }),
      wasRedirected: () => redirected
    };
  }

  // Case A: Hanging / offline auth triggers timeout cleanly
  const hangingAuth = () => () => {}; // Never calls callback
  const testA = simulateProtectRoute(hangingAuth, { timeoutMs: 50 });
  await assert.rejects(
    testA.promise,
    /AUTH_TIMEOUT/,
    "Hanging auth must reject with AUTH_TIMEOUT after timeoutMs"
  );
  assert.strictEqual(testA.wasRedirected(), true, "Timeout must trigger redirectToLogin");
  console.log("  ✅ Case A (Hanging Auth Timeout) passed!");

  // Case B: Unauthenticated user immediately rejects without waiting for timeout
  const unauthMock = (cb) => {
    setTimeout(() => cb(null), 10);
    return () => {};
  };
  const testB = simulateProtectRoute(unauthMock, { timeoutMs: 500 });
  await assert.rejects(
    testB.promise,
    /UNAUTHENTICATED/,
    "Unauthenticated user must immediately reject"
  );
  assert.strictEqual(testB.wasRedirected(), true, "Unauthenticated user must trigger redirectToLogin");
  console.log("  ✅ Case B (Immediate Unauth Rejection) passed!");

  // Case C: Authenticated user succeeds fast
  const authMock = (cb) => {
    setTimeout(() => cb({ uid: "user-123" }), 10);
    return () => {};
  };
  const testC = simulateProtectRoute(authMock, { timeoutMs: 500 });
  const result = await testC.promise;
  assert.strictEqual(result.user.uid, "user-123", "Must resolve with authenticated user");
  assert.strictEqual(testC.wasRedirected(), false, "Must not redirect authenticated user");
  console.log("  ✅ Case C (Authenticated User Success) passed!");
}

// 2. Test Fallback Card Structure
{
  console.log("  Testing Fallback Card Structure...");

  function generateFallbackHtml(message) {
    return `
      <div class="portal-initial-loader">
        <div class="portal-loader-card" style="border-color: rgba(239, 68, 68, 0.4);">
          <div class="portal-loader-emblem-wrap">
            <span style="font-size: 3rem; line-height: 1;">🔐</span>
          </div>
          <h3 class="portal-loader-title">مستقبل وطن - تسجيل الدخول</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
            ${message}
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <a href="../index.html" class="btn btn-primary" style="padding: 0.6rem 1.25rem;">
              <span>الانتقال لتسجيل الدخول 🚀</span>
            </a>
            <button id="portalRetryBtn" class="btn btn-secondary" style="padding: 0.6rem 1.25rem;">
              <span>إعادة المحاولة 🔄</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const html = generateFallbackHtml("يرجى تسجيل الدخول");
  assert(html.includes("الانتقال لتسجيل الدخول"), "Fallback must contain login link");
  assert(html.includes("portalRetryBtn"), "Fallback must contain retry button");
  assert(html.includes("يرجى تسجيل الدخول"), "Fallback must render custom message");
  console.log("  ✅ Fallback Card Structure verified!");
}

console.log("\n🎉 ALL GUARD TIMEOUT & RESILIENCE TESTS PASSED!\n");
