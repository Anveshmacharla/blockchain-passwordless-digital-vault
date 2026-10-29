import { randomUUID } from "crypto";
import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { DigitalVault } from "../models/DigitalVault";
import { File } from "../models/File";
import { BlockchainRecord } from "../models/BlockchainRecord";
import { AppError } from "../utils/AppError";

import {
  generateDataEncryptionKey,
  encryptData,
  wrapDataEncryptionKey,
} from "../services/encryption.service";

import {
  unwrapDataEncryptionKey,
  decryptData,
} from "../services/encryption.service";

import {
  writeEncryptedFile,
  writeWrappedKey,
  deleteFileStorage,
} from "../services/storage.service";

import {
  readEncryptedFile,
  readWrappedKey,
} from "../services/storage.service";

import {
  generateSha256Hash,
} from "../services/hash.service";

import {
  registerFileOnBlockchain,
  updateFileHashOnBlockchain,
  updateFileStatusOnBlockchain,
  getBlockchainContractAddress,
  getBlockchainServiceWalletAddress,
} from "../services/blockchain.service";

import { createAuditLog } from "../services/audit.service";
import { createSecurityAlert } from "../services/security-alert.service";

import {
  verifyFileIntegrity,
} from "../services/integrity.service";

import {
  checkFilePermission,
  getFilePermissionStatus,
} from "../services/permission.service";

import { AccessPermission } from "../models/AccessPermission";

export const uploadFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;

    const vault = await DigitalVault.findOne({
      user_id: userId,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    if (!req.file) {
      next(
        new AppError(
          400,
          "FILE_REQUIRED",
          "File upload is required"
        )
      );
      return;
    }

    const file = req.file;

    // Generate unique file ID
    const fileId = randomUUID();

    // Generate a unique 256-bit DEK
    const dek = generateDataEncryptionKey();

    // Encrypt the uploaded file using AES-256-GCM
    const encrypted = encryptData(
      file.buffer,
      dek
    );

    // Create encrypted file representation:
    // nonce || ciphertext || authentication tag
    const encryptedRepresentation = Buffer.concat([
      encrypted.nonce,
      encrypted.ciphertext,
      encrypted.authTag,
    ]);

    // Wrap the DEK using the application KEK
    const wrappedKey = wrapDataEncryptionKey(dek);

    // Store encrypted file
    await writeEncryptedFile(
      vault.vault_id,
      fileId,
      encryptedRepresentation
    );

    // Store wrapped DEK
    await writeWrappedKey(
      vault.vault_id,
      fileId,
      wrappedKey
    );

    // Generate SHA-256 hash of:
    // nonce || ciphertext || authentication tag
    const sha256Hash = generateSha256Hash(
      encrypted.nonce,
      encrypted.ciphertext,
      encrypted.authTag
    );

    // Create FILE database record
    const fileRecord = new File({
      file_id: fileId,
      vault_id: vault.vault_id,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      storage_reference: `vaults/${vault.vault_id}/${fileId}`,
      sha256_hash: sha256Hash,
      file_status: "ACTIVE",
      uploaded_at: new Date(),
    });

    await fileRecord.save();

    // Register the SHA-256 hash on the blockchain
    const ownerAddress =
      getBlockchainServiceWalletAddress();

    let blockchainResult;

    try {
      blockchainResult =
        await registerFileOnBlockchain(
          fileId,
          `0x${sha256Hash}`,
          ownerAddress
        );
    } catch (blockchainError) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
        description:
          "Blockchain transaction failed while registering the uploaded file",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
      });

      next(
        new AppError(
          502,
          "BLOCKCHAIN_TRANSACTION_FAILED",
          "File uploaded, but blockchain registration failed"
        )
      );
      return;
    }

    // Create BLOCKCHAIN_RECORD database record
    const blockchainRecord =
      new BlockchainRecord({
        file_id: fileId,
        transaction_hash:
          blockchainResult.transactionHash,
        sha256_hash: sha256Hash,
        owner_address: ownerAddress,
        smart_contract_reference:
          getBlockchainContractAddress(),
        timestamp: new Date(),
        blockchain_status: "ACTIVE",
      });

    await blockchainRecord.save();

    // Create audit record
    await createAuditLog({
      user_id: userId,
      file_id: fileId,
      action: "FILE_UPLOADED",
      transaction_reference:
        blockchainResult.transactionHash,
    });

    console.log(
      "Authenticated user:",
      userId
    );
    console.log(
      "Vault ID:",
      vault.vault_id
    );
    console.log(
      "File ID:",
      fileId
    );
    console.log(
      "File name:",
      file.originalname
    );
    console.log(
      "File type:",
      file.mimetype
    );
    console.log(
      "File size:",
      file.size
    );
    console.log(
      "SHA-256:",
      sha256Hash
    );
    console.log(
      "Blockchain transaction:",
      blockchainResult.transactionHash
    );

    res.status(201).json({
      message:
        "File uploaded successfully",
      user_id: userId,
      vault_id:
        vault.vault_id,
      file_id: fileId,
      file_name:
        file.originalname,
      file_type:
        file.mimetype,
      file_size:
        file.size,
      sha256_hash:
        sha256Hash,
      transaction_hash:
        blockchainResult.transactionHash,
    });
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;

    const vault = await DigitalVault.findOne({
      user_id: userId,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const ownFiles = await File.find({
      vault_id: vault.vault_id,
      file_status: {
        $ne: "DELETED",
      },
    })
      .select(
        "file_id vault_id file_name file_type file_size storage_reference sha256_hash file_status uploaded_at"
      )
      .sort({
        uploaded_at: -1,
      });

    const sharedPermissions =
      await AccessPermission.find({
        user_id: userId,
        permission_status: "ACTIVE",
        $or: [
          {
            expiry_date: {
              $exists: false,
            },
          },
          {
            expiry_date: null,
          },
          {
            expiry_date: {
              $gt: new Date(),
            },
          },
        ],
      }).select("file_id");

    const sharedFileIds =
      sharedPermissions.map(
        (permission) =>
          permission.file_id
      );

    const sharedFiles =
      sharedFileIds.length > 0
        ? await File.find({
            file_id: {
              $in: sharedFileIds,
            },
            file_status: {
              $ne: "DELETED",
            },
          })
            .select(
              "file_id vault_id file_name file_type file_size storage_reference sha256_hash file_status uploaded_at"
            )
            .sort({
              uploaded_at: -1,
            })
        : [];

    const allFiles = [
      ...ownFiles,
      ...sharedFiles,
    ];

    const uniqueFiles = Array.from(
      new Map(
        allFiles.map((file) => [
          file.file_id,
          file,
        ])
      ).values()
    );

    uniqueFiles.sort(
      (a, b) =>
        new Date(
          b.uploaded_at
        ).getTime() -
        new Date(
          a.uploaded_at
        ).getTime()
    );

    res.status(200).json({
      message: "Files retrieved successfully",
      vault_id: vault.vault_id,
      files: uniqueFiles,
    });
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const file = await File.findOne({
      file_id: fileId,
      file_status: {
        $ne: "DELETED",
      },
    }).select(
      "file_id vault_id file_name file_type file_size storage_reference sha256_hash file_status uploaded_at"
    );

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: file.vault_id,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const isOwner =
      vault.user_id === userId;

    if (!isOwner) {
      const permissionStatus =
        await getFilePermissionStatus(
          userId,
          fileId,
          "VIEW"
        );

      if (
        permissionStatus === "EXPIRED" ||
        permissionStatus === "REVOKED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "REVOKED_PERMISSION_ACCESS",
          description:
            "User attempted to access a file using an expired or revoked VIEW permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "REVOKED_PERMISSION_FILE_ACCESS",
        });

        next(
          new AppError(
            403,
            "FILE_ACCESS_DENIED",
            "The VIEW permission is expired or revoked"
          )
        );
        return;
      }

      if (
        permissionStatus !== "GRANTED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "UNAUTHORIZED_ACCESS",
          description:
            "User attempted to access a file without VIEW permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "UNAUTHORIZED_FILE_ACCESS",
        });

        next(
          new AppError(
            403,
            "FILE_ACCESS_DENIED",
            "VIEW permission is required to access this file"
          )
        );
        return;
      }
    }

    res.status(200).json({
      message:
        "File retrieved successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const file = await File.findOne({
      file_id: fileId,
      file_status: {
        $ne: "DELETED",
      },
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: file.vault_id,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const isOwner =
      vault.user_id === userId;

    if (!isOwner) {
      const permissionStatus =
        await getFilePermissionStatus(
          userId,
          fileId,
          "VIEW"
        );

      if (
        permissionStatus === "EXPIRED" ||
        permissionStatus === "REVOKED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "REVOKED_PERMISSION_ACCESS",
          description:
            "User attempted to verify a file using an expired or revoked VIEW permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "REVOKED_PERMISSION_FILE_VERIFICATION",
        });

        next(
          new AppError(
            403,
            "FILE_ACCESS_DENIED",
            "The VIEW permission is expired or revoked"
          )
        );
        return;
      }

      if (
        permissionStatus !== "GRANTED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "UNAUTHORIZED_ACCESS",
          description:
            "User attempted to verify a file without VIEW permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "UNAUTHORIZED_FILE_VERIFICATION",
        });

        next(
          new AppError(
            403,
            "FILE_ACCESS_DENIED",
            "VIEW permission is required to verify this file"
          )
        );
        return;
      }
    }

    const integrityResult =
      await verifyFileIntegrity(
        vault.vault_id,
        fileId
      );

    if (!integrityResult.verified) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type: "INTEGRITY_MISMATCH",
        description:
          "Blockchain integrity verification failed for the requested file",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action: "FILE_INTEGRITY_MISMATCH",
      });

      next(
        new AppError(
          409,
          "INTEGRITY_VERIFICATION_FAILED",
          "File integrity verification failed"
        )
      );
      return;
    }

    res.status(200).json({
      message:
        "File integrity verification completed",
      file_id: fileId,
      stored_hash: file.sha256_hash,
      calculated_hash:
        integrityResult.calculatedHash,
      blockchain_hash:
        integrityResult.blockchainHash,
      status: integrityResult.status,
      verified: integrityResult.verified,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const file = await File.findOne({
      file_id: fileId,
      file_status: "ACTIVE",
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: file.vault_id,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const isOwner =
      vault.user_id === userId;

    if (!isOwner) {
      const permissionStatus =
        await getFilePermissionStatus(
          userId,
          fileId,
          "DOWNLOAD"
        );

      if (
        permissionStatus === "EXPIRED" ||
        permissionStatus === "REVOKED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "REVOKED_PERMISSION_ACCESS",
          description:
            "User attempted to download a file using an expired or revoked DOWNLOAD permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "REVOKED_PERMISSION_FILE_DOWNLOAD",
        });

        next(
          new AppError(
            403,
            "FILE_DOWNLOAD_DENIED",
            "The DOWNLOAD permission is expired or revoked"
          )
        );
        return;
      }

      if (
        permissionStatus !== "GRANTED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "UNAUTHORIZED_ACCESS",
          description:
            "User attempted to download a file without DOWNLOAD permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "UNAUTHORIZED_FILE_DOWNLOAD",
        });

        next(
          new AppError(
            403,
            "FILE_DOWNLOAD_DENIED",
            "DOWNLOAD permission is required to download this file"
          )
        );
        return;
      }
    }

    const integrityResult =
      await verifyFileIntegrity(
        vault.vault_id,
        fileId
      );

    if (!integrityResult.verified) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type: "INTEGRITY_MISMATCH",
        description:
          "Blockchain integrity verification failed for the requested file",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action: "FILE_INTEGRITY_MISMATCH",
      });

      next(
        new AppError(
          409,
          "INTEGRITY_VERIFICATION_FAILED",
          "File integrity verification failed"
        )
      );
      return;
    }

    const encryptedFile =
      await readEncryptedFile(
        vault.vault_id,
        fileId
      );

    const wrappedKey =
      await readWrappedKey(
        vault.vault_id,
        fileId
      );

    const NONCE_LENGTH = 12;
    const AUTH_TAG_LENGTH = 16;

    if (
      encryptedFile.length <
      NONCE_LENGTH + AUTH_TAG_LENGTH
    ) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type: "STORAGE_INTEGRITY_FAILURE",
        description:
          "Encrypted file representation is invalid",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action: "INVALID_ENCRYPTED_FILE",
      });

      next(
        new AppError(
          500,
          "INVALID_ENCRYPTED_FILE",
          "Invalid encrypted file representation"
        )
      );
      return;
    }

    const nonce = encryptedFile.subarray(
      0,
      NONCE_LENGTH
    );

    const authTag = encryptedFile.subarray(
      encryptedFile.length - AUTH_TAG_LENGTH
    );

    const ciphertext = encryptedFile.subarray(
      NONCE_LENGTH,
      encryptedFile.length - AUTH_TAG_LENGTH
    );

    try {
      const dek =
        unwrapDataEncryptionKey(
          wrappedKey
        );

      const decryptedFile =
        decryptData(
          {
            nonce,
            ciphertext,
            authTag,
          },
          dek
        );

      res.status(200);

      res.setHeader(
        "Content-Type",
        file.file_type
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(
          file.file_name
        )}"`
      );

      res.setHeader(
        "Content-Length",
        decryptedFile.length
      );

      res.send(decryptedFile);
    } catch (decryptionError) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type: "STORAGE_INTEGRITY_FAILURE",
        description:
          "Encrypted file decryption or key unwrapping failed",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action: "FILE_DECRYPTION_FAILURE",
      });

      next(
        new AppError(
          500,
          "FILE_DECRYPTION_FAILED",
          "File decryption failed"
        )
      );
      return;
    }
  } catch (error) {
    next(error);
  }
};

export const updateFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const existingFile = await File.findOne({
      file_id: fileId,
      file_status: "ACTIVE",
    });

    if (!existingFile) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: existingFile.vault_id,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const isOwner =
      vault.user_id === userId;

    if (!isOwner) {
      const permissionStatus =
        await getFilePermissionStatus(
          userId,
          fileId,
          "MANAGE"
        );

      if (
        permissionStatus === "EXPIRED" ||
        permissionStatus === "REVOKED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "REVOKED_PERMISSION_ACCESS",
          description:
            "User attempted to update a file using an expired or revoked MANAGE permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "REVOKED_PERMISSION_FILE_UPDATE",
        });

        next(
          new AppError(
            403,
            "FILE_MANAGEMENT_DENIED",
            "The MANAGE permission is expired or revoked"
          )
        );
        return;
      }

      if (
        permissionStatus !== "GRANTED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "AUTHORIZATION_FAILURE",
          description:
            "User attempted to update a file without MANAGE permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "UNAUTHORIZED_FILE_UPDATE",
        });

        next(
          new AppError(
            403,
            "FILE_MANAGEMENT_DENIED",
            "MANAGE permission is required to update this file"
          )
        );
        return;
      }
    }

    if (!req.file) {
      next(
        new AppError(
          400,
          "FILE_REQUIRED",
          "Updated file is required"
        )
      );
      return;
    }

    const file = req.file;

    const dek =
      generateDataEncryptionKey();

    const encrypted =
      encryptData(
        file.buffer,
        dek
      );

    const encryptedRepresentation =
      Buffer.concat([
        encrypted.nonce,
        encrypted.ciphertext,
        encrypted.authTag,
      ]);

    const wrappedKey =
      wrapDataEncryptionKey(dek);

    const sha256Hash =
      generateSha256Hash(
        encrypted.nonce,
        encrypted.ciphertext,
        encrypted.authTag
      );

    await writeEncryptedFile(
      vault.vault_id,
      fileId,
      encryptedRepresentation
    );

    await writeWrappedKey(
      vault.vault_id,
      fileId,
      wrappedKey
    );

    let blockchainResult;

    try {
      blockchainResult =
        await updateFileHashOnBlockchain(
          fileId,
          `0x${sha256Hash}`
        );
    } catch (blockchainError) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
        description:
          "Blockchain transaction failed while updating the file hash",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
      });

      next(
        new AppError(
          502,
          "BLOCKCHAIN_TRANSACTION_FAILED",
          "File update failed because blockchain hash update failed"
        )
      );
      return;
    }

    existingFile.file_name =
      file.originalname;

    existingFile.file_type =
      file.mimetype;

    existingFile.file_size =
      file.size;

    existingFile.sha256_hash =
      sha256Hash;

    existingFile.uploaded_at =
      new Date();

    await existingFile.save();

    const blockchainRecord =
      await BlockchainRecord.findOne({
        file_id: fileId,
      });

    if (blockchainRecord) {
      blockchainRecord.transaction_hash =
        blockchainResult.transactionHash;

      blockchainRecord.sha256_hash =
        sha256Hash;

      blockchainRecord.timestamp =
        new Date();

      blockchainRecord.blockchain_status =
        "ACTIVE";

      await blockchainRecord.save();
    }

    await createAuditLog({
      user_id: userId,
      file_id: fileId,
      action: "FILE_UPDATED",
      transaction_reference:
        blockchainResult.transactionHash,
    });

    res.status(200).json({
      message:
        "File updated successfully",
      file_id: fileId,
      file_name:
        file.originalname,
      file_type:
        file.mimetype,
      file_size:
        file.size,
      sha256_hash:
        sha256Hash,
      transaction_hash:
        blockchainResult.transactionHash,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
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

    const userId = req.user.userId;
    const fileIdParam = req.params.fileId;

    if (Array.isArray(fileIdParam)) {
      next(
        new AppError(
          400,
          "INVALID_FILE_ID",
          "Invalid file ID"
        )
      );
      return;
    }

    const fileId = fileIdParam;

    const file = await File.findOne({
      file_id: fileId,
      file_status: "ACTIVE",
    });

    if (!file) {
      next(
        new AppError(
          404,
          "FILE_NOT_FOUND",
          "File not found"
        )
      );
      return;
    }

    const vault = await DigitalVault.findOne({
      vault_id: file.vault_id,
      vault_status: "ACTIVE",
    });

    if (!vault) {
      next(
        new AppError(
          404,
          "VAULT_NOT_FOUND",
          "Active digital vault not found"
        )
      );
      return;
    }

    const isOwner =
      vault.user_id === userId;

    if (!isOwner) {
      const permissionStatus =
        await getFilePermissionStatus(
          userId,
          fileId,
          "MANAGE"
        );

      if (
        permissionStatus === "EXPIRED" ||
        permissionStatus === "REVOKED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "REVOKED_PERMISSION_ACCESS",
          description:
            "User attempted to delete a file using an expired or revoked MANAGE permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "REVOKED_PERMISSION_FILE_DELETION",
        });

        next(
          new AppError(
            403,
            "FILE_MANAGEMENT_DENIED",
            "The MANAGE permission is expired or revoked"
          )
        );
        return;
      }

      if (
        permissionStatus !== "GRANTED"
      ) {
        await createSecurityAlert({
          user_id: userId,
          file_id: fileId,
          alert_type:
            "AUTHORIZATION_FAILURE",
          description:
            "User attempted to delete a file without MANAGE permission",
          severity: "MEDIUM",
        });

        await createAuditLog({
          user_id: userId,
          file_id: fileId,
          action:
            "UNAUTHORIZED_FILE_DELETION",
        });

        next(
          new AppError(
            403,
            "FILE_MANAGEMENT_DENIED",
            "MANAGE permission is required to delete this file"
          )
        );
        return;
      }
    }

    await deleteFileStorage(
      vault.vault_id,
      fileId
    );

    let blockchainResult;

    try {
      blockchainResult =
        await updateFileStatusOnBlockchain(
          fileId,
          2
        );
    } catch (blockchainError) {
      await createSecurityAlert({
        user_id: userId,
        file_id: fileId,
        alert_type:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
        description:
          "Blockchain transaction failed while updating the file status to DELETED",
        severity: "HIGH",
      });

      await createAuditLog({
        user_id: userId,
        file_id: fileId,
        action:
          "BLOCKCHAIN_TRANSACTION_FAILURE",
      });

      next(
        new AppError(
          502,
          "BLOCKCHAIN_TRANSACTION_FAILED",
          "File deletion failed because blockchain status update failed"
        )
      );
      return;
    }

    file.file_status = "DELETED";

    await file.save();

    const blockchainRecord =
      await BlockchainRecord.findOne({
        file_id: fileId,
      });

    if (blockchainRecord) {
      blockchainRecord.transaction_hash =
        blockchainResult.transactionHash;

      blockchainRecord.timestamp =
        new Date();

      blockchainRecord.blockchain_status =
        "DELETED";

      await blockchainRecord.save();
    }

    await createAuditLog({
      user_id: userId,
      file_id: fileId,
      action: "FILE_DELETED",
      transaction_reference:
        blockchainResult.transactionHash,
    });

    res.status(200).json({
      message:
        "File deleted successfully",
      file_id: fileId,
      file_status: "DELETED",
      transaction_hash:
        blockchainResult.transactionHash,
    });
  } catch (error) {
    next(error);
  }
};