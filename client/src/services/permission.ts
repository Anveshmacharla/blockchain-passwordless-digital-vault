const API_BASE_URL = "http://localhost:5000/api";

export type PermissionType =
  | "VIEW"
  | "DOWNLOAD"
  | "MANAGE";

export interface FilePermission {
  permission_id: string;
  file_id: string;
  user_id: string;
  permission_type: PermissionType;
  permission_status: string;
  expiry_date?: string;
  granted_at?: string;
  revoked_at?: string;
}

interface GrantPermissionResponse {
  message: string;
  permission_id: string;
  file_id: string;
  user_id: string;
  permission_type: PermissionType;
  permission_status: string;
  expiry_date?: string;
  granted_at?: string;
}

interface GetPermissionsResponse {
  message: string;
  file_id: string;
  permissions: FilePermission[];
}

interface RevokePermissionResponse {
  message: string;
  permission_id: string;
  file_id: string;
  user_id: string;
  permission_type: PermissionType;
  permission_status: string;
  revoked_at?: string;
}

export const grantPermission = async (
  fileId: string,
  userId: string,
  permissionType: PermissionType,
  expiryDate?: string
): Promise<GrantPermissionResponse> => {
  const csrfResponse = await fetch(
    `${API_BASE_URL}/auth/csrf-token`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!csrfResponse.ok) {
    throw new Error(
      "Failed to obtain CSRF token"
    );
  }

  const csrfData =
    await csrfResponse.json();

  const body: {
    user_id: string;
    permission_type: PermissionType;
    expiry_date?: string;
  } = {
    user_id: userId,
    permission_type: permissionType,
  };

  if (expiryDate) {
    body.expiry_date = expiryDate;
  }

  const response = await fetch(
    `${API_BASE_URL}/permissions/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfData.csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "Failed to grant permission"
    );
  }

  return response.json();
};

export const getPermissions = async (
  fileId: string
): Promise<FilePermission[]> => {
  const response = await fetch(
    `${API_BASE_URL}/permissions/files/${fileId}/permissions`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message ||
        "Failed to load permissions"
    );
  }

  const data: GetPermissionsResponse =
    await response.json();

  return data.permissions;
};

export const revokePermission = async (
  fileId: string,
  permissionId: string
): Promise<RevokePermissionResponse> => {
  const csrfResponse = await fetch(
    `${API_BASE_URL}/auth/csrf-token`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!csrfResponse.ok) {
    throw new Error(
      "Failed to obtain CSRF token"
    );
  }

  const csrfData =
    await csrfResponse.json();

  const response = await fetch(
    `${API_BASE_URL}/permissions/files/${fileId}/permissions/${permissionId}`,
    {
      method: "DELETE",
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
        "Failed to revoke permission"
    );
  }

  return response.json();
};