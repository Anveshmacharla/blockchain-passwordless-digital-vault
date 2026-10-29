import { Response, NextFunction } from "express";

import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "./authMiddleware";

import { createAuditLog } from "../services/audit.service";
import { createSecurityAlert } from "../services/security-alert.service";

export const requireRole = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
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

    if (!allowedRoles.includes(req.user.role)) {
      const userId = req.user.userId;

      void createSecurityAlert({
        user_id: userId,
        alert_type: "AUTHORIZATION_FAILURE",
        description:
          "User attempted to access a resource without the required role",
        severity: "MEDIUM",
      }).catch((error) => {
        console.error(
          "Failed to create authorization security alert:",
          error
        );
      });

      void createAuditLog({
        user_id: userId,
        action: "AUTHORIZATION_FAILURE",
      }).catch((error) => {
        console.error(
          "Failed to create authorization audit log:",
          error
        );
      });

      next(
        new AppError(
          403,
          "AUTHORIZATION_FAILED",
          "You are not authorized to perform this action"
        )
      );
      return;
    }

    next();
  };
};