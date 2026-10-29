import { Router } from "express";

import {
  registerOptions,
  registerVerify,
  loginOptions,
  loginVerify,
  getMe,
  logout,
  getCsrfToken,
} from "../controllers/auth.controller";

import { requireAuthentication } from "../middleware/authMiddleware";

import { doubleCsrfProtection } from "../config/csrf";

const router = Router();

router.post("/register/options", registerOptions);

router.post("/register/verify", registerVerify);

router.post("/login/options", loginOptions);

router.post("/login/verify", loginVerify);

router.post(
  "/logout",
  requireAuthentication,
  doubleCsrfProtection,
  logout
);

router.get("/me", requireAuthentication, getMe);

router.get(
  "/csrf-token",
  requireAuthentication,
  getCsrfToken
);

export default router;