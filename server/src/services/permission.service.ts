import { AccessPermission } from "../models/AccessPermission";

export type RequiredPermission =
  | "VIEW"
  | "DOWNLOAD"
  | "MANAGE";

export type PermissionAccessStatus =
  | "GRANTED"
  | "EXPIRED"
  | "REVOKED"
  | "NOT_FOUND"
  | "INSUFFICIENT";

const permissionLevel: Record<
  RequiredPermission,
  number
> = {
  VIEW: 1,
  DOWNLOAD: 2,
  MANAGE: 3,
};

export const checkFilePermission = async (
  userId: string,
  fileId: string,
  requiredPermission: RequiredPermission
): Promise<boolean> => {
  const permission =
    await AccessPermission.findOne({
      user_id: userId,
      file_id: fileId,
      permission_status: "ACTIVE",
    });

  if (!permission) {
    return false;
  }

  if (
    permission.expiry_date &&
    permission.expiry_date.getTime() <=
      Date.now()
  ) {
    return false;
  }

  const grantedLevel =
    permissionLevel[
      permission.permission_type as RequiredPermission
    ];

  const requiredLevel =
    permissionLevel[requiredPermission];

  return grantedLevel >= requiredLevel;
};

export const getFilePermissionStatus = async (
  userId: string,
  fileId: string,
  requiredPermission: RequiredPermission
): Promise<PermissionAccessStatus> => {
  const permission =
    await AccessPermission.findOne({
      user_id: userId,
      file_id: fileId,
    });

  if (!permission) {
    return "NOT_FOUND";
  }

  if (
    permission.permission_status ===
    "REVOKED"
  ) {
    return "REVOKED";
  }

  if (
    permission.expiry_date &&
    permission.expiry_date.getTime() <=
      Date.now()
  ) {
    return "EXPIRED";
  }

  if (
    permission.permission_status !==
    "ACTIVE"
  ) {
    return "NOT_FOUND";
  }

  const grantedLevel =
    permissionLevel[
      permission.permission_type as RequiredPermission
    ];

  const requiredLevel =
    permissionLevel[requiredPermission];

  if (grantedLevel < requiredLevel) {
    return "INSUFFICIENT";
  }

  return "GRANTED";
};