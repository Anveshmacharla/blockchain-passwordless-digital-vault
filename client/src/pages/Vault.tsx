import { useEffect, useState } from "react";

import {
  createVault,
  getMyVault,
  type DigitalVault,
} from "../services/vault";

import {
  uploadFile,
  getFiles,
  verifyFile,
  downloadFile,
  type VaultFile,
} from "../services/file";

import {
  grantPermission,
  getPermissions,
  revokePermission,
  type FilePermission,
  type PermissionType,
} from "../services/permission";

const Vault = () => {
  const [vault, setVault] =
    useState<DigitalVault | null>(null);

  const [files, setFiles] =
    useState<VaultFile[]>([]);

  const [vaultName, setVaultName] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [processingFileId, setProcessingFileId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [permissions, setPermissions] =
    useState<Record<string, FilePermission[]>>(
      {}
    );

  const [permissionUserId, setPermissionUserId] =
    useState<Record<string, string>>({});

  const [permissionType, setPermissionType] =
    useState<Record<string, PermissionType>>(
      {}
    );

  const [permissionExpiry, setPermissionExpiry] =
    useState<Record<string, string>>({});

  const [permissionLoadingFileId, setPermissionLoadingFileId] =
    useState<string | null>(null);

  useEffect(() => {
    const loadVault = async () => {
      try {
        const currentVault =
          await getMyVault();

        setVault(currentVault);

        const currentFiles =
          await getFiles();

        setFiles(currentFiles);

        const permissionResults: Record<
          string,
          FilePermission[]
        > = {};

        for (const file of currentFiles) {
          try {
            permissionResults[file.file_id] =
              await getPermissions(
                file.file_id
              );
          } catch {
            permissionResults[file.file_id] =
              [];
          }
        }

        setPermissions(
          permissionResults
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load vault";

        if (
          errorMessage ===
          "Digital vault was not found"
        ) {
          setVault(null);
        } else {
          setMessage(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadVault();
  }, []);

  const handleCreateVault = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setCreating(true);

    try {
      const newVault =
        await createVault(vaultName);

      setVault(newVault);
      setVaultName("");
      setMessage(
        "Digital vault created successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create vault"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setMessage("");
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setMessage("");
    setUploading(true);

    try {
      const file =
        await uploadFile(selectedFile);

      setFiles((currentFiles) => [
        file,
        ...currentFiles,
      ]);

      setPermissions((current) => ({
        ...current,
        [file.file_id]: [],
      }));

      setSelectedFile(null);

      setMessage(
        "File uploaded successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "File upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyFile = async (
    fileId: string
  ) => {
    setMessage("");
    setProcessingFileId(fileId);

    try {
      const result =
        await verifyFile(fileId);

      if (result.verified) {
        setMessage(
          "Integrity verification successful. File is authentic and has not been tampered with."
        );
      } else {
        setMessage(
          "Integrity verification failed. File may have been tampered with."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "File integrity verification failed."
      );
    } finally {
      setProcessingFileId(null);
    }
  };

  const handleDownloadFile = async (
    fileId: string,
    fileName: string
  ) => {
    setMessage("");
    setProcessingFileId(fileId);

    try {
      await downloadFile(
        fileId,
        fileName
      );

      setMessage(
        "File downloaded successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "File download failed."
      );
    } finally {
      setProcessingFileId(null);
    }
  };

  const handleGrantPermission = async (
    fileId: string
  ) => {
    const userId =
      permissionUserId[fileId]?.trim();

    const selectedPermission =
      permissionType[fileId] || "VIEW";

    const expiry =
      permissionExpiry[fileId];

    if (!userId) {
      setMessage(
        "Please enter the target user ID."
      );
      return;
    }

    setMessage("");
    setPermissionLoadingFileId(fileId);

    try {
      await grantPermission(
        fileId,
        userId,
        selectedPermission,
        expiry || undefined
      );

      const updatedPermissions =
        await getPermissions(fileId);

      setPermissions((current) => ({
        ...current,
        [fileId]: updatedPermissions,
      }));

      setPermissionUserId((current) => ({
        ...current,
        [fileId]: "",
      }));

      setPermissionExpiry((current) => ({
        ...current,
        [fileId]: "",
      }));

      setMessage(
        "Permission granted successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to grant permission."
      );
    } finally {
      setPermissionLoadingFileId(null);
    }
  };

  const handleRevokePermission = async (
    fileId: string,
    permissionId: string
  ) => {
    setMessage("");
    setPermissionLoadingFileId(fileId);

    try {
      await revokePermission(
        fileId,
        permissionId
      );

      const updatedPermissions =
        await getPermissions(fileId);

      setPermissions((current) => ({
        ...current,
        [fileId]: updatedPermissions,
      }));

      setMessage(
        "Permission revoked successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to revoke permission."
      );
    } finally {
      setPermissionLoadingFileId(null);
    }
  };

  if (loading) {
    return <p>Loading vault...</p>;
  }

  if (vault) {
    return (
      <div>
        <h2>Your Digital Vault</h2>

        <p>
          <strong>Vault Name:</strong>{" "}
          {vault.vault_name}
        </p>

        <p>
          <strong>Vault ID:</strong>{" "}
          {vault.vault_id}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {vault.vault_status}
        </p>

        <p>
          <strong>Created:</strong>{" "}
          {new Date(
            vault.created_at
          ).toLocaleString()}
        </p>

        <hr />

        <h3>Upload File</h3>

        <input
          type="file"
          onChange={handleFileSelection}
        />

        {selectedFile && (
          <div>
            <p>
              Selected file:{" "}
              <strong>
                {selectedFile.name}
              </strong>
            </p>

            <p>
              Size:{" "}
              {(
                selectedFile.size /
                1024
              ).toFixed(2)}{" "}
              KB
            </p>

            <button
              onClick={handleFileUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload File"}
            </button>
          </div>
        )}

        {message && <p>{message}</p>}

        <hr />

        <h3>My Files</h3>

        {files.length === 0 ? (
          <p>No files in your vault.</p>
        ) : (
          <div>
            {files.map((file) => (
              <div
                key={file.file_id}
                style={{
                  border: "1px solid #ccc",
                  padding: "12px",
                  marginBottom: "15px",
                }}
              >
                <p>
                  <strong>Name:</strong>{" "}
                  {file.file_name}
                </p>

                <p>
                  <strong>Type:</strong>{" "}
                  {file.file_type ||
                    "Unknown"}
                </p>

                <p>
                  <strong>Size:</strong>{" "}
                  {(
                    file.file_size /
                    1024
                  ).toFixed(2)}{" "}
                  KB
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {file.file_status}
                </p>

                <p>
                  <strong>Uploaded:</strong>{" "}
                  {new Date(
                    file.uploaded_at
                  ).toLocaleString()}
                </p>

                <button
                  onClick={() =>
                    handleVerifyFile(
                      file.file_id
                    )
                  }
                  disabled={
                    processingFileId ===
                    file.file_id
                  }
                >
                  {processingFileId ===
                  file.file_id
                    ? "Processing..."
                    : "Verify Integrity"}
                </button>

                {" "}

                <button
                  onClick={() =>
                    handleDownloadFile(
                      file.file_id,
                      file.file_name
                    )
                  }
                  disabled={
                    processingFileId ===
                    file.file_id
                  }
                >
                  {processingFileId ===
                  file.file_id
                    ? "Processing..."
                    : "Download"}
                </button>

                <hr />

                <h4>Manage Permissions</h4>

                <div>
                  <label>
                    Target User ID
                  </label>

                  <br />

                  <input
                    type="text"
                    value={
                      permissionUserId[
                        file.file_id
                      ] || ""
                    }
                    onChange={(event) =>
                      setPermissionUserId(
                        (current) => ({
                          ...current,
                          [file.file_id]:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Enter user ID"
                  />
                </div>

                <br />

                <div>
                  <label>
                    Permission
                  </label>

                  <br />

                  <select
                    value={
                      permissionType[
                        file.file_id
                      ] || "VIEW"
                    }
                    onChange={(event) =>
                      setPermissionType(
                        (current) => ({
                          ...current,
                          [file.file_id]:
                            event.target
                              .value as PermissionType,
                        })
                      )
                    }
                  >
                    <option value="VIEW">
                      VIEW
                    </option>

                    <option value="DOWNLOAD">
                      DOWNLOAD
                    </option>

                    <option value="MANAGE">
                      MANAGE
                    </option>
                  </select>
                </div>

                <br />

                <div>
                  <label>
                    Expiry Date
                  </label>

                  <br />

                  <input
                    type="datetime-local"
                    value={
                      permissionExpiry[
                        file.file_id
                      ] || ""
                    }
                    onChange={(event) =>
                      setPermissionExpiry(
                        (current) => ({
                          ...current,
                          [file.file_id]:
                            event.target.value,
                        })
                      )
                    }
                  />
                </div>

                <br />

                <button
                  onClick={() =>
                    handleGrantPermission(
                      file.file_id
                    )
                  }
                  disabled={
                    permissionLoadingFileId ===
                    file.file_id
                  }
                >
                  {permissionLoadingFileId ===
                  file.file_id
                    ? "Processing..."
                    : "Grant Permission"}
                </button>

                <h4>
                  Current Permissions
                </h4>

                {(
                  permissions[
                    file.file_id
                  ] || []
                ).length === 0 ? (
                  <p>
                    No permissions granted.
                  </p>
                ) : (
                  <div>
                    {(
                      permissions[
                        file.file_id
                      ] || []
                    ).map(
                      (permission) => (
                        <div
                          key={
                            permission.permission_id
                          }
                          style={{
                            border:
                              "1px solid #ddd",
                            padding:
                              "8px",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <p>
                            <strong>
                              User ID:
                            </strong>{" "}
                            {
                              permission.user_id
                            }
                          </p>

                          <p>
                            <strong>
                              Permission:
                            </strong>{" "}
                            {
                              permission.permission_type
                            }
                          </p>

                          <p>
                            <strong>
                              Status:
                            </strong>{" "}
                            {
                              permission.permission_status
                            }
                          </p>

                          {permission.expiry_date && (
                            <p>
                              <strong>
                                Expiry:
                              </strong>{" "}
                              {new Date(
                                permission.expiry_date
                              ).toLocaleString()}
                            </p>
                          )}

                          {permission.permission_status ===
                            "ACTIVE" && (
                            <button
                              onClick={() =>
                                handleRevokePermission(
                                  file.file_id,
                                  permission.permission_id
                                )
                              }
                              disabled={
                                permissionLoadingFileId ===
                                file.file_id
                              }
                            >
                              Revoke Permission
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Create Your Digital Vault</h2>

      <p>
        No digital vault has been created
        for your account.
      </p>

      <form
        onSubmit={handleCreateVault}
      >
        <div>
          <label htmlFor="vaultName">
            Vault Name
          </label>

          <br />

          <input
            id="vaultName"
            type="text"
            value={vaultName}
            onChange={(event) =>
              setVaultName(
                event.target.value
              )
            }
            placeholder="My Digital Vault"
            required
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={creating}
        >
          {creating
            ? "Creating Vault..."
            : "Create Digital Vault"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default Vault;