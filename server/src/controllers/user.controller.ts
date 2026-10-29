import { Response, NextFunction } from "express";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getMyProfile = async (
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

    const user = await User.findOne({
      user_id: req.user.userId,
    }).lean();

    if (!user) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "User account was not found"
        )
      );
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
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

    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
      next(
        new AppError(
          400,
          "NO_FIELDS_TO_UPDATE",
          "No profile fields were provided for update"
        )
      );
      return;
    }

    if (name !== undefined && typeof name !== "string") {
      next(
        new AppError(
          400,
          "INVALID_NAME",
          "Name must be a string"
        )
      );
      return;
    }

    if (email !== undefined && typeof email !== "string") {
      next(
        new AppError(
          400,
          "INVALID_EMAIL",
          "Email must be a string"
        )
      );
      return;
    }

    const user = await User.findOne({
      user_id: req.user.userId,
    });

    if (!user) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "User account was not found"
        )
      );
      return;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
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

    const users = await User.find({})
      .select({
        user_id: 1,
        name: 1,
        email: 1,
        role: 1,
        account_status: 1,
        created_at: 1,
      })
      .lean();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
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

    const { userId } = req.params;

    const user = await User.findOne({
      user_id: userId,
    })
      .select({
        user_id: 1,
        name: 1,
        email: 1,
        role: 1,
        account_status: 1,
        created_at: 1,
      })
      .lean();

    if (!user) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "User account was not found"
        )
      );
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserById = async (
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

    const { userId } = req.params;
    const { name, email, role, account_status } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      role === undefined &&
      account_status === undefined
    ) {
      next(
        new AppError(
          400,
          "NO_FIELDS_TO_UPDATE",
          "No user fields were provided for update"
        )
      );
      return;
    }

    if (name !== undefined && typeof name !== "string") {
      next(
        new AppError(
          400,
          "INVALID_NAME",
          "Name must be a string"
        )
      );
      return;
    }

    if (email !== undefined && typeof email !== "string") {
      next(
        new AppError(
          400,
          "INVALID_EMAIL",
          "Email must be a string"
        )
      );
      return;
    }

    const allowedRoles = [
      "USER",
      "VAULT_ADMIN",
      "SYSTEM_ADMIN",
    ];

    if (
      role !== undefined &&
      (typeof role !== "string" || !allowedRoles.includes(role))
    ) {
      next(
        new AppError(
          400,
          "INVALID_ROLE",
          "Invalid user role"
        )
      );
      return;
    }

    const allowedAccountStatuses = [
      "ACTIVE",
      "PENDING",
      "SUSPENDED",
      "DISABLED",
    ];

    if (
      account_status !== undefined &&
      (typeof account_status !== "string" ||
        !allowedAccountStatuses.includes(account_status))
    ) {
      next(
        new AppError(
          400,
          "INVALID_ACCOUNT_STATUS",
          "Invalid account status"
        )
      );
      return;
    }

    const user = await User.findOne({
      user_id: userId,
    });

    if (!user) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "User account was not found"
        )
      );
      return;
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (account_status !== undefined) {
      user.account_status = account_status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};