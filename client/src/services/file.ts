const API_BASE_URL = "http://localhost:5000/api";

export interface VaultFile {
  file_id: string;
  vault_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_reference: string;
  sha256_hash: string;
  file_status: string;
  uploaded_at: string;
}

interface UploadFileResponse {
  success: boolean;
  file: VaultFile;
}

interface GetFilesResponse {
  success: boolean;
  files: VaultFile[];
}

interface VerifyFileResponse {
  message: string;
  file_id: string;
  stored_hash: string;
  calculated_hash: string;
  blockchain_hash: string;
  status: string;
  verified: boolean;
}

export const uploadFile = async (
  file: File
): Promise<VaultFile> => {
  const csrfResponse = await fetch(
    `${API_BASE_URL}/auth/csrf-token`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!csrfResponse.ok) {
    throw new Error("Failed to obtain CSRF token");
  }

  const csrfData = await csrfResponse.json();

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/files`,
    {
      method: "POST",
      headers: {
        "x-csrf-token": csrfData.csrfToken,
      },
      credentials: "include",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "Failed to upload file"
    );
  }

  const data: UploadFileResponse =
    await response.json();

  return data.file;
};

export const getFiles = async (): Promise<VaultFile[]> => {
  const response = await fetch(
    `${API_BASE_URL}/files`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "Failed to load files"
    );
  }

  const data: GetFilesResponse =
    await response.json();

  return data.files;
};

export const verifyFile = async (
  fileId: string
): Promise<VerifyFileResponse> => {
  const csrfResponse = await fetch(
    `${API_BASE_URL}/auth/csrf-token`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!csrfResponse.ok) {
    throw new Error("Failed to obtain CSRF token");
  }

  const csrfData = await csrfResponse.json();

  const response = await fetch(
    `${API_BASE_URL}/files/${fileId}/verify`,
    {
      method: "POST",
      headers: {
        "x-csrf-token": csrfData.csrfToken,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "File integrity verification failed"
    );
  }

  const data: VerifyFileResponse =
    await response.json();

  return data;
};

export const downloadFile = async (
  fileId: string,
  fileName: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/files/${fileId}/download`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "File download failed"
    );
  }

  const blob = await response.blob();

  const downloadUrl =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = downloadUrl;
  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
};