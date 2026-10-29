const API_BASE_URL = "http://localhost:5000/api";

export interface DigitalVault {
  vault_id: string;
  user_id: string;
  vault_name: string;
  created_at: string;
  vault_status: string;
}

interface VaultResponse {
  success: boolean;
  vault: DigitalVault;
}

export const getMyVault = async (): Promise<DigitalVault> => {
  const response = await fetch(
    `${API_BASE_URL}/vaults/me`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message || "Failed to retrieve vault"
    );
  }

  const data: VaultResponse = await response.json();

  return data.vault;
};

export const createVault = async (
  vaultName: string
): Promise<DigitalVault> => {
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
    `${API_BASE_URL}/vaults`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfData.csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({
        vault_name: vaultName,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error?.error?.message || "Failed to create vault"
    );
  }

  const data: VaultResponse = await response.json();

  return data.vault;
};