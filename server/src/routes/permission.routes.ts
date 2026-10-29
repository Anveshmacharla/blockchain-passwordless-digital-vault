import { Router } from "express";

import { requireAuthentication } from "../middleware/authMiddleware";
import { doubleCsrfProtection } from "../config/csrf";

import {
  grantPermission,
  getPermissions,
  revokePermission,
} from "../controllers/permission.controller";

const router = Router();

router.post(
  "/files/:fileId/permissions",
  requireAuthentication,
  doubleCsrfProtection,
  grantPermission
);

router.get(
  "/files/:fileId/permissions",
  requireAuthentication,
  getPermissions
);

router.delete(
  "/files/:fileId/permissions/:permissionId",
  requireAuthentication,
  doubleCsrfProtection,
  revokePermission
);

export default router;