// src/repositories/api.client.js
import { functions, httpsCallable } from "../core/firebase.js";
import { normalizeError, AppError } from "../core/errors.js";
import { FEATURES } from "../core/constants.js";

/**
 * Executes a Firebase HTTPS Callable Cloud Function with unified error normalization.
 * If Cloud Functions are disabled (USE_CLOUD_FUNCTIONS = false), immediately throws
 * to allow direct resilient Firestore/Storage/Auth operations without 404 network overhead.
 * @param {string} functionName - Cloud Function name
 * @param {object} data - Payload data
 * @returns {Promise<any>}
 */
export async function callApi(functionName, data = {}) {
  if (!FEATURES.USE_CLOUD_FUNCTIONS) {
    throw new AppError(
      "خدمة الخادم السحابي غير مفعلة على هذا المشروع. يتم استخدام الاتصال المباشر بقاعدة البيانات.",
      "FUNCTIONS_UNAVAILABLE"
    );
  }

  try {
    const fn = httpsCallable(functions, functionName);
    const result = await fn(data);
    return result.data;
  } catch (error) {
    console.error(`API Call [${functionName}] Error:`, error);
    throw normalizeError(error);
  }
}
