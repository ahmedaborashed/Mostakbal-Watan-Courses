import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export type UserRole = "student" | "teacher" | "admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: UserRole;
  group?: string;
}

/**
 * Extracts and verifies the authenticated user from the CallableRequest.
 * Supports Custom Claims with fallback to legacy email suffixes during migration.
 */
export function getAuthenticatedUser(request: CallableRequest): AuthenticatedUser {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً للقيام بهذه العملية.");
  }

  const { uid, token } = request.auth;
  const email = token.email || "";

  // Determine role from custom claims or email suffix
  let role: UserRole = (token.role as UserRole) || "student";
  if (!token.role && email) {
    if (email.endsWith("@admin.local")) {
      role = "admin";
    } else if (email.endsWith("@system.local")) {
      role = "teacher";
    } else {
      role = "student";
    }
  }

  return {
    uid,
    email,
    role,
    group: token.group as string | undefined
  };
}

/**
 * Enforces that the caller has one of the allowed roles.
 */
export function requireRole(request: CallableRequest, allowedRoles: UserRole[]): AuthenticatedUser {
  const user = getAuthenticatedUser(request);
  if (!allowedRoles.includes(user.role)) {
    throw new HttpsError("permission-denied", "ليس لديك الصلاحية لتنفيذ هذا الإجراء.");
  }
  return user;
}
