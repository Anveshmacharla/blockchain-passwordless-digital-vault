import { Router } from "express";

import {
  createVault,
  getMyVault,
  updateMyVault,
} from "../controllers/vault.controller";

import { requireAuthentication } from "../middleware/authMiddleware";
import { doubleCsrfProtection } from "../config/csrf";

const router = Router();

router.post(
  "/",
  requireAuthentication,
  doubleCsrfProtection,
  createVault
);

router.get(
  "/me",
  requireAuthentication,
  getMyVault
);

router.patch(
  "/:vaultId",
  requireAuthentication,
  doubleCsrfProtection,
  updateMyVault
);

export default router;