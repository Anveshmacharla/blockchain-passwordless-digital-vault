import { Request, Response, NextFunction } from "express";

import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { generateAccessToken } from "../utils/jwt";

import {
  generateRegistrationOptionsForUser,
  verifyRegistrationForUser,
  generateLoginOptionsForUser,
  verifyLoginForUser,
} from "../auth/webauthn.service";

import { AuthenticatedRequest } from "../middleware/authMiddleware";

import { generateCsrfToken } from "../config/csrf";

export const registerOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email } = req.body;

    const options = await generateRegistrationOptionsForUser(name, email);

    res.status(200).json({
      success: true,
      options,
    });
  } catch (error) {
    next(error);
  }
};

export const registerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, response } = req.body;

    const result = await verifyRegistrationForUser(email, response);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const loginOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const options = await generateLoginOptionsForUser(email);

    res.status(200).json({
      success: true,
      options,
    });
  } catch (error) {
    next(error);
  }
};

export const loginVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, response } = req.body;

    const result = await verifyLoginForUser(email, response);

    const token = generateAccessToken(
      result.userId,
      result.role
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      verified: result.verified,
      userId: result.userId,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
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
    }).select(
      "user_id name email role account_status created_at"
    );

    if (!user) {
      next(
        new AppError(
          404,
          "USER_NOT_FOUND",
          "Authenticated user was not found"
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

export const getCsrfToken = async (
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

    const csrfToken = generateCsrfToken(req, res);

    res.status(200).json({
      success: true,
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};