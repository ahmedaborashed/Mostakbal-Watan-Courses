import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { auth } from "../../config/firebase";
import { getAuthenticatedUser, requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";

const SetRoleSchema = z.object({
  targetUid: z.string().min(1, "معرف المستخدم مطلوب"),
  role: z.enum(["student", "teacher", "admin"])
});

export async function setUserRoleHandler(request: CallableRequest) {
  requireRole(request, ["admin"]);
  const { targetUid, role } = validateInput(SetRoleSchema, request.data);

  const targetUser = await auth.getUser(targetUid);
  const currentClaims = targetUser.customClaims || {};

  await auth.setCustomUserClaims(targetUid, {
    ...currentClaims,
    role
  });

  return {
    success: true,
    message: `تم تعيين صلاحية (${role}) للمستخدم بنجاح`
  };
}

/**
 * Self-healing claim synchronizer:
 * When a user logs in, frontend can call this once to ensure custom claims are set
 * based on legacy email or database profile.
 */
export async function syncUserClaimsHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const authUser = await auth.getUser(user.uid);
  const currentClaims = authUser.customClaims || {};

  if (!currentClaims.role) {
    let resolvedRole = user.role; // determined from email suffix
    await auth.setCustomUserClaims(user.uid, {
      ...currentClaims,
      role: resolvedRole
    });

    return {
      synced: true,
      role: resolvedRole
    };
  }

  return {
    synced: false,
    role: currentClaims.role
  };
}
