import {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { createSecurityAlert } from "../services/security-alert.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const requireAuthentication = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication is required"
        )
      );
      return;
    }

    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    void createSecurityAlert({
      alert_type: "SESSION_SECURITY_FAILURE",
      description:
        "Invalid, expired, or tampered authentication session token was rejected",
      severity: "HIGH",
    }).catch((alertError) => {
      console.error(
        "Failed to create session security alert:",
        alertError
      );
    });

    next(
      new AppError(
        401,
        "INVALID_OR_EXPIRED_TOKEN",
        "Invalid or expired authentication token"
      )
    );
  }
};