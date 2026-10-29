import { Router } from "express";

import upload from "../middleware/upload.middleware";
import { requireAuthentication } from "../middleware/authMiddleware";

import {
  uploadFile,
  getFiles,
  getFileById,
  verifyFile,
  downloadFile,
  updateFile,
  deleteFile,
} from "../controllers/file.controller";

import { doubleCsrfProtection } from "../config/csrf";

const router = Router();

router.post(
  "/",
  requireAuthentication,
  doubleCsrfProtection,
  upload.single("file"),
  uploadFile
);

router.get(
  "/",
  requireAuthentication,
  getFiles
);

router.post(
  "/:fileId/verify",
  requireAuthentication,
  doubleCsrfProtection,
  verifyFile
);

router.get(
  "/:fileId/download",
  requireAuthentication,
  downloadFile
);

router.patch(
  "/:fileId",
  requireAuthentication,
  doubleCsrfProtection,
  upload.single("file"),
  updateFile
);

router.get(
  "/:fileId",
  requireAuthentication,
  getFileById
);

router.delete(
  "/:fileId",
  requireAuthentication,
  doubleCsrfProtection,
  deleteFile
);

export default router;