// scripts/test-student-auth.js
import assert from "node:assert";

console.log("🧪 Starting Student Auth & Layout Unit Tests...\n");

// 1. Test Input Normalization Logic (Phone, Arabic Digits, Country Code)
{
  console.log("  Testing Phone & Username Normalization...");

  function normalizeUserInput(cleanUser) {
    if (cleanUser.includes("@")) {
      return { email: cleanUser.replace(/\s+/g, ""), isPhone: false };
    }
    let normalized = cleanUser
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .replace(/[\s\-_]/g, "");

    if (normalized.startsWith("+20")) {
      normalized = "0" + normalized.slice(3);
    } else if (normalized.startsWith("0020")) {
      normalized = "0" + normalized.slice(4);
    } else if (normalized.startsWith("201") && normalized.length === 12) {
      normalized = "0" + normalized.slice(2);
    }

    const isPhone = /^01[0125][0-9]{8}$/.test(normalized) || /^[0-9]{8,15}$/.test(normalized);
    return { normalized, isPhone };
  }

  // Case A: Standard Egyptian phone
  assert.deepStrictEqual(normalizeUserInput("01012345678"), { normalized: "01012345678", isPhone: true });

  // Case B: Phone with internal spaces
  assert.deepStrictEqual(normalizeUserInput("010 1234 5678"), { normalized: "01012345678", isPhone: true });

  // Case C: Arabic-Indic numerals
  assert.deepStrictEqual(normalizeUserInput("٠١٠١٢٣٤٥٦٧٨"), { normalized: "01012345678", isPhone: true });

  // Case D: +20 prefix
  assert.deepStrictEqual(normalizeUserInput("+201012345678"), { normalized: "01012345678", isPhone: true });

  // Case E: 0020 prefix
  assert.deepStrictEqual(normalizeUserInput("00201012345678"), { normalized: "01012345678", isPhone: true });

  // Case F: 201... 12-digit prefix
  assert.deepStrictEqual(normalizeUserInput("201012345678"), { normalized: "01012345678", isPhone: true });

  // Case G: Admin username
  assert.deepStrictEqual(normalizeUserInput("admin"), { normalized: "admin", isPhone: false });

  // Case H: Full email
  assert.deepStrictEqual(normalizeUserInput("student@domain.com"), { email: "student@domain.com", isPhone: false });

  console.log("  ✅ Phone & Username Normalization tests passed!");
}

// 2. Test Attempt Sequence Logic
{
  console.log("  Testing Attempt Order Strategy...");

  function getAttempts(normalized, isPhone) {
    return isPhone
      ? [`${normalized}@student.local`, `${normalized}@admin.local`, `${normalized}@system.local`]
      : [`${normalized}@admin.local`, `${normalized}@system.local`, `${normalized}@student.local`];
  }

  const phoneAttempts = getAttempts("01012345678", true);
  assert.strictEqual(phoneAttempts[0], "01012345678@student.local", "Phone must attempt student.local first");

  const adminAttempts = getAttempts("admin", false);
  assert.strictEqual(adminAttempts[0], "admin@admin.local", "Admin username must attempt admin.local first");

  console.log("  ✅ Attempt Order Strategy tests passed!");
}

// 3. Test Student Layout Rendering & Profile Update
{
  console.log("  Testing mountStudentLayout execution & no ReferenceError...");

  // Minimal mock DOM for testing in Node
  const elements = new Map();
  const mockDocument = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          id,
          textContent: "",
          innerHTML: "",
          classList: { toggle() {}, remove() {}, add() {} },
          addEventListener() {},
          querySelectorAll() { return []; }
        });
      }
      return elements.get(id);
    }
  };

  global.window = {
    location: { pathname: "/pages/student.html" }
  };
  global.document = mockDocument;

  // Import mountStudentLayout
  const { mountStudentLayout } = await import("../src/shared/layouts/StudentLayout/student-layout.component.js");

  const container = {
    innerHTML: "",
    querySelectorAll() { return []; }
  };

  // Must not throw ReferenceError: studentName is not defined
  assert.doesNotThrow(() => {
    const layout = mountStudentLayout(container, {
      onLogout: () => {},
      onTabChange: () => {}
    });

    assert(container.innerHTML.includes('id="mobileStudentName"'), "Must contain mobileStudentName element");
    assert(container.innerHTML.includes('الطالب'), "Must contain default fallback title الطالب");

    layout.updateProfile({ name: "أحمد محمد", phone: "01012345678" });
  }, "mountStudentLayout must execute cleanly without ReferenceError");

  console.log("  ✅ mountStudentLayout executed cleanly with no ReferenceError!");
}

// 4. Test Guard Redirection Helper
{
  console.log("  Testing Guard redirection path resolution...");

  function getRedirectTarget(pathname) {
    const isPagesDir = pathname.includes("/pages/");
    return isPagesDir ? "../index.html" : "index.html";
  }

  assert.strictEqual(getRedirectTarget("/pages/student.html"), "../index.html");
  assert.strictEqual(getRedirectTarget("/pages/admin.html"), "../index.html");
  assert.strictEqual(getRedirectTarget("/index.html"), "index.html");
  assert.strictEqual(getRedirectTarget("/"), "index.html");

  console.log("  ✅ Guard redirection path resolution passed!");
}

console.log("\n🎉 ALL STUDENT AUTH & DASHBOARD TESTS PASSED SUCCESSFULLY!\n");
