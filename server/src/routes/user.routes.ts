import { Router } from "express";

import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUserById,
} from "../controllers/user.controller";

import { requireAuthentication } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/rbacMiddleware";
import { doubleCsrfProtection } from "../config/csrf";

const router = Router();

router.get(
  "/me",
  requireAuthentication,
  getMyProfile
);

router.patch(
  "/me",
  requireAuthentication,
  doubleCsrfProtection,
  updateMyProfile
);

router.get(
  "/",
  requireAuthentication,
  requireRole("SYSTEM_ADMIN"),
  getAllUsers
);

router.get(
  "/:userId",
  requireAuthentication,
  requireRole("SYSTEM_ADMIN"),
  getUserById
);

router.patch(
  "/:userId",
  requireAuthentication,
  requireRole("SYSTEM_ADMIN"),
  doubleCsrfProtection,
  updateUserById
);

export default router;