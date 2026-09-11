// src/features/python-adventure/python-adventure-runtime.js

let skulptLoadingPromise = null;

/**
 * Dynamically loads Skulpt Python runtime from local vendor assets or CDN fallback.
 * @returns {Promise<boolean>}
 */
export async function ensurePythonRuntime() {
  if (window.Sk && window.Sk.builtin) {
    return true;
  }

  if (skulptLoadingPromise) {
    return skulptLoadingPromise;
  }

  skulptLoadingPromise = (async () => {
    try {
      const isSubdir = window.location.pathname.includes("/pages/");
      const localPrefix = isSubdir ? "../assets/vendor/skulpt/" : "assets/vendor/skulpt/";

      await loadScript(`${localPrefix}skulpt.min.js`);
      await loadScript(`${localPrefix}skulpt-stdlib.js`);
      return true;
    } catch (localErr) {
      console.warn("Local Skulpt load failed, trying CDN fallback:", localErr);
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js");
        return true;
      } catch (cdnErr) {
        console.error("Failed to load Python execution engine:", cdnErr);
        throw new Error("تعذر تحميل محرك بايثون البرمجي. تحقق من اتصالك بالإنترنت.");
      }
    }
  })();

  return skulptLoadingPromise;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Safely executes Python code inside Skulpt in the browser sandbox.
 * @param {string} pythonCode
 * @param {object} options
 * @param {number} [options.timeoutMs=3000] - Infinite loop prevention
 * @param {function} [options.onOutput] - Real-time stdout stream
 * @returns {Promise<{ output: string, error: string | null, executionTimeMs: number }>}
 */
export async function runPythonCode(pythonCode, { timeoutMs = 3500, onOutput = null } = {}) {
  await ensurePythonRuntime();

  let outputBuffer = "";
  const startTime = performance.now();

  const handleOut = (text) => {
    outputBuffer += text;
    if (typeof onOutput === "function") {
      onOutput(outputBuffer);
    }
  };

  const builtinRead = (file) => {
    if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles["files"][file] === undefined) {
      throw new Error(`File not found: '${file}'`);
    }
    return window.Sk.builtinFiles["files"][file];
  };

  window.Sk.configure({
    output: handleOut,
    read: builtinRead,
    execLimit: timeoutMs,
    killableWhile: true,
    __future__: window.Sk.python3
  });

  try {
    const promise = window.Sk.misceval.asyncToPromise(() => {
      return window.Sk.importMainWithBody("<stdin>", false, pythonCode, true);
    });

    // Enforce strict client-side timeout promise race
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("TimeoutError: استغرق تنفيذ الكود وقتاً أطول من المسموح (تأكد من عدم وجود حلقة لا نهائية Infinite Loop)."));
      }, timeoutMs);
    });

    await Promise.race([promise, timeoutPromise]);

    const executionTimeMs = Math.round(performance.now() - startTime);
    return {
      output: outputBuffer,
      error: null,
      executionTimeMs
    };

  } catch (err) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    const rawError = err.toString();
    const cleanError = cleanPythonErrorMessage(rawError);

    return {
      output: outputBuffer,
      error: cleanError,
      executionTimeMs
    };
  }
}

/**
 * Translates and cleans Python error messages for Arabic student readability.
 */
function cleanPythonErrorMessage(errStr) {
  if (!errStr) return "حدث خطأ غير معروف أثناء تشغيل الكود.";

  if (errStr.includes("TimeoutError") || errStr.includes("TimeLimitExceeded")) {
    return "⏱️ استغرق الكود وقتاً أطول من المسموح (تأكد من عدم وجود حلقة تكرار لا نهائية Infinite Loop).";
  }

  // Extract Line number if present
  let lineMatch = errStr.match(/on line (\d+)/i) || errStr.match(/line (\d+)/i);
  const lineInfo = lineMatch ? ` (السطر ${lineMatch[1]})` : "";

  if (errStr.includes("SyntaxError")) {
    return `❌ خطأ في صياغة الكود SyntaxError${lineInfo}: تأكد من إغلاق الأقواس أو علامات التنصيص أو النقطتين :`;
  }
  if (errStr.includes("NameError")) {
    return `❌ خطأ في اسم المتغير أو الدالة NameError${lineInfo}: تم استخدام اسم لم يتم تعريفه مسبقاً.`;
  }
  if (errStr.includes("IndentationError")) {
    return `❌ خطأ في المسافات البادئة IndentationError${lineInfo}: بايثون تتطلب 4 مسافات دقيقة داخل الشروط والحلقات والدوال.`;
  }
  if (errStr.includes("TypeError")) {
    return `❌ خطأ في نوع البيانات TypeError${lineInfo}: تم تطبيق عملية غير متوافقة مع نوع المتغير.`;
  }
  if (errStr.includes("IndexError")) {
    return `❌ خطأ في الفهرس IndexError${lineInfo}: حاولت الوصول إلى عنصر غير موجود في القائمة.`;
  }
  if (errStr.includes("ZeroDivisionError")) {
    return `❌ خطأ رياضي ZeroDivisionError${lineInfo}: لا يمكن القسمة على الصفر.`;
  }

  return `❌ خطأ أثناء التشغيل${lineInfo}: ${errStr}`;
}
