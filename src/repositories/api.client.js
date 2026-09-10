// src/repositories/api.client.js
import { functions, httpsCallable } from "../core/firebase.js";
import { normalizeError } from "../core/errors.js";

/**
 * Executes a Firebase HTTPS Callable Cloud Function with unified error normalization.
 * @param {string} functionName - Cloud Function name
 * @param {object} data - Payload data
 * @returns {Promise<any>}
 */
export async function callApi(functionName, data = {}) {
  try {
    const fn = httpsCallable(functions, functionName);
    const result = await fn(data);
    return result.data;
  } catch (error) {
    console.error(`API Call [${functionName}] Error:`, error);
    throw normalizeError(error);
  }
}
