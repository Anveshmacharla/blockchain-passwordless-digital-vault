import { Response } from "express";
import { randomUUID } from "crypto";

import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { DigitalVault } from "../models/DigitalVault";
import { File } from "../models/File";
import { User } from "../models/User";
import { AccessPermission } from "../models/AccessPermission";
import { AppError } from "../utils/AppError";

import { createAuditLog } from "../services/audit.service";

export const grantPermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    if (!req.user) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required"
        )
      );
      return;
    }

    const ownerId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const {
      user_id,
      permission_type,
      expiry_date,
    } = req.body;

    if (!user_id) {
      next(
        new AppError(
          400,
          "USER_REQUIRED",
          "Target user ID is required"
        )
      );
      return;
    }

    if (
      !["VIEW", "DOWNLOAD", "MANAGE"].includes(
        permission_type
      )
    ) {
      next(
        new AppError(
          400,
          "INVALID_PERMISSION_TYPE",
          "Permission type must be VIEW, DOWNLOAD, or MANAGE"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      user_id: ownerId,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const file = await File.findOne({
      file_id: fileId,
      vault_id: vault.vault_id,
      file_status: "ACTIVE",
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const targetUser = await User.findOne({
      user_id,
      account_status: {
        $ne: "DISABLED",
      },
    });

    if (!targetUser) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "Target user not found"
        )
      );
      return;
    }

    if (user_id === ownerId) {
      next(
        new AppError(
          400,
          "OWNER_PERMISSION_NOT_REQUIRED",
          "File owner does not require a permission record"
        )
      );
      return;
    }

    const existingPermission =
      await AccessPermission.findOne({
        file_id: fileId,
        user_id,
        permission_status: "ACTIVE",
      });

    if (existingPermission) {
      next(
        new AppError(
          409,
          "PERMISSION_ALREADY_EXISTS",
          "Active permission already exists for this user"
        )
      );
      return;
    }

    const permission = new AccessPermission({
      permission_id: randomUUID(),
      file_id: fileId,
      user_id,
      permission_type,
      permission_status: "ACTIVE",
      expiry_date: expiry_date
        ? new Date(expiry_date)
        : undefined,
      granted_at: new Date(),
    });

    await permission.save();

    await createAuditLog({
      user_id: ownerId,
      file_id: fileId,
      action: "PERMISSION_GRANTED",
    });

    res.status(201).json({
      message: "Permission granted successfully",
      permission_id:
        permission.permission_id,
      file_id: permission.file_id,
      user_id: permission.user_id,
      permission_type:
        permission.permission_type,
      permission_status:
        permission.permission_status,
      expiry_date:
        permission.expiry_date,
      granted_at:
        permission.granted_at,
    });
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    if (!req.user) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required"
        )
      );
      return;
    }

    const ownerId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const vault = await DigitalVault.findOne({
      user_id: ownerId,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const file = await File.findOne({
      file_id: fileId,
      vault_id: vault.vault_id,
      file_status: "ACTIVE",
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const permissions = await AccessPermission.find({
      file_id: fileId,
    }).select(
      "permission_id file_id user_id permission_type permission_status expiry_date granted_at revoked_at"
    );

    res.status(200).json({
      message: "Permissions retrieved successfully",
      file_id: fileId,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

export const revokePermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    if (!req.user) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required"
        )
      );
      return;
    }

    const ownerId = req.user.userId;
    const fileIdParam = req.params.fileId;
    const permissionIdParam =
      req.params.permissionId;

    if (
      Array.isArray(fileIdParam) ||
      Array.isArray(permissionIdParam)
    ) {
      next(
        new AppError(
          400,
          "INVALID_PARAMETER",
          "Invalid file ID or permission ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;
    const permissionId = permissionIdParam;

    const vault = await DigitalVault.findOne({
      user_id: ownerId,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const file = await File.findOne({
      file_id: fileId,
      vault_id: vault.vault_id,
      file_status: "ACTIVE",
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const permission =
      await AccessPermission.findOne({
        permission_id: permissionId,
        file_id: fileId,
        permission_status: "ACTIVE",
      });

    if (!permission) {
      next(
        new AppError(
          404,
          "PERMISSION_NOT_FOUND",
          "Active permission not found"
        )
      );
      return;
    }

    permission.permission_status =
      "REVOKED";

    permission.revoked_at = new Date();

    await permission.save();

    await createAuditLog({
      user_id: ownerId,
      file_id: fileId,
      action: "PERMISSION_REVOKED",
    });

    res.status(200).json({
      message:
        "Permission revoked successfully",
      permission_id:
        permission.permission_id,
      file_id: permission.file_id,
      user_id: permission.user_id,
      permission_type:
        permission.permission_type,
      permission_status:
        permission.permission_status,
      revoked_at:
        permission.revoked_at,
    });
  } catch (error) {
    next(error);
  }
};