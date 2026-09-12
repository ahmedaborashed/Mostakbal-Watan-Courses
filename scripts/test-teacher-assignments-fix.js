// scripts/test-teacher-assignments-fix.js
const elements = new Map();

function createMockElement(tag, id = "", className = "") {
  return {
    tagName: tag.toUpperCase(),
    id,
    className,
    innerHTML: "",
    querySelectorAll(sel) { return []; },
    querySelector(sel) { return null; }
  };
}

const teacherContainer = createMockElement("div", "teacherAssignmentsContainer", "");
const classTarget = createMockElement("div", "custom-id", "my-class");

elements.set("teacherAssignmentsContainer", teacherContainer);
elements.set("custom-id", classTarget);

global.document = {
  getElementById(id) {
    return elements.get(id) || null;
  },
  querySelector(sel) {
    if (sel.startsWith("#")) {
      return elements.get(sel.slice(1)) || null;
    }
    if (sel.startsWith(".")) {
      for (const el of elements.values()) {
        if (el.className === sel.slice(1)) return el;
      }
    }
    return null;
  }
};

import { setHtml } from "../src/shared/utils/dom.utils.js";

console.log("1. Testing setHtml with plain ID string ('teacherAssignmentsContainer')...");
setHtml("teacherAssignmentsContainer", "<form id='newTask'>Form Content</form>");
if (teacherContainer.innerHTML.includes("newTask")) {
  console.log("   ✅ PASS: setHtml successfully resolved plain string ID 'teacherAssignmentsContainer'");
} else {
  console.error("   ❌ FAIL: setHtml failed on plain string ID");
  process.exit(1);
}

console.log("2. Testing setHtml with hash ID selector ('#teacherAssignmentsContainer')...");
setHtml("#teacherAssignmentsContainer", "<form id='newTask2'>Updated Content</form>");
if (teacherContainer.innerHTML.includes("newTask2")) {
  console.log("   ✅ PASS: setHtml successfully resolved '#teacherAssignmentsContainer'");
} else {
  console.error("   ❌ FAIL: setHtml failed on hash ID selector");
  process.exit(1);
}

console.log("3. Testing setHtml with class selector ('.my-class')...");
setHtml(".my-class", "<p>Class Content</p>");
if (classTarget.innerHTML.includes("Class Content")) {
  console.log("   ✅ PASS: setHtml successfully resolved '.my-class'");
} else {
  console.error("   ❌ FAIL: setHtml failed on class selector");
  process.exit(1);
}

console.log("4. Testing setHtml with direct DOM Element...");
const directEl = createMockElement("div");
setHtml(directEl, "<span>Direct</span>");
if (directEl.innerHTML === "<span>Direct</span>") {
  console.log("   ✅ PASS: setHtml successfully supported direct HTMLElement");
} else {
  console.error("   ❌ FAIL: setHtml failed on direct HTMLElement");
  process.exit(1);
}

console.log("\n==================================================");
console.log("🎉 ALL 4 SETHTML CONTAINER RESOLUTION CHECKS PASSED!");
console.log("==================================================");
