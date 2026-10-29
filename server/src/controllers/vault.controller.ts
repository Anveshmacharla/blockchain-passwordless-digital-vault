import { Response, NextFunction } from "express";

import { DigitalVault } from "../models/DigitalVault";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const createVault = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const { vault_name } = req.body;

    if (
      vault_name === undefined ||
      typeof vault_name !== "string" ||
      vault_name.trim().length === 0
    ) {
      next(
        new AppError(
          400,
          "INVALID_VAULT_NAME",
          "A valid vault name is required"
        )
      );
      return;
    }

    const existingVault = await DigitalVault.findOne({
      user_id: req.user.userId,
    });

    if (existingVault) {
      next(
        new AppError(
          409,
          "VAULT_ALREADY_EXISTS",
          "A digital vault already exists for this user"
        )
      );
      return;
    }

    const vault = await DigitalVault.create({
      user_id: req.user.userId,
      vault_name: vault_name.trim(),
      vault_status: "ACTIVE",
    });

    res.status(201).json({
      success: true,
      message: "Digital vault created successfully",
      vault: {
        vault_id: vault.vault_id,
        user_id: vault.user_id,
        vault_name: vault.vault_name,
        created_at: vault.created_at,
        vault_status: vault.vault_status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVault = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const vault = await DigitalVault.findOne({
      user_id: req.user.userId,
    }).lean();

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Digital vault was not found"
        )
      );
      return;
    }

    res.status(200).json({
      success: true,
      vault: {
        vault_id: vault.vault_id,
        user_id: vault.user_id,
        vault_name: vault.vault_name,
        created_at: vault.created_at,
        vault_status: vault.vault_status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyVault = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const { vaultId } = req.params;
    const { vault_name } = req.body;

    if (
      vault_name === undefined ||
      typeof vault_name !== "string" ||
      vault_name.trim().length === 0
    ) {
      next(
        new AppError(
          400,
          "INVALID_VAULT_NAME",
          "A valid vault name is required"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: vaultId,
      user_id: req.user.userId,
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Digital vault was not found"
        )
      );
      return;
    }

    vault.vault_name = vault_name.trim();

    await vault.save();

    res.status(200).json({
      success: true,
      message: "Digital vault updated successfully",
      vault: {
        vault_id: vault.vault_id,
        user_id: vault.user_id,
        vault_name: vault.vault_name,
        created_at: vault.created_at,
        vault_status: vault.vault_status,
      },
    });
  } catch (error) {
    next(error);
  }
};