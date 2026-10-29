import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

const API_BASE_URL = "http://localhost:5000/api";

interface RegistrationOptionsResponse {
  success: boolean;
  options: PublicKeyCredentialCreationOptionsJSON;
}

interface RegistrationVerifyResponse {
  success: boolean;
  verified: boolean;
  userId: string;
  role: string;
}

export const registerUser = async (
  name: string,
  email: string
): Promise<RegistrationVerifyResponse> => {
  // 1. Request WebAuthn registration options from backend
  const optionsResponse = await fetch(
    `${API_BASE_URL}/auth/register/options`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        email,
      }),
    }
  );

  if (!optionsResponse.ok) {
    const error = await optionsResponse.json();

    throw new Error(
      error?.error?.message || "Failed to generate registration options"
    );
  }

  const { options }: RegistrationOptionsResponse =
    await optionsResponse.json();

  // 2. Start the browser/device passkey ceremony
  const registrationResponse = await startRegistration({
    optionsJSON: options,
  });

  // 3. Send the completed ceremony response to backend
  const verifyResponse = await fetch(
    `${API_BASE_URL}/auth/register/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        response: registrationResponse,
      }),
    }
  );

  if (!verifyResponse.ok) {
    const error = await verifyResponse.json();

    throw new Error(
      error?.error?.message ||
        "WebAuthn registration verification failed"
    );
  }

  return verifyResponse.json();
};

interface LoginOptionsResponse {
  success: boolean;
  options: PublicKeyCredentialRequestOptionsJSON;
}

interface LoginVerifyResponse {
  success: boolean;
  verified: boolean;
  userId: string;
  role: string;
}

export const loginUser = async (
  email: string
): Promise<LoginVerifyResponse> => {
  const optionsResponse = await fetch(
    `${API_BASE_URL}/auth/login/options`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    }
  );

  if (!optionsResponse.ok) {
    const error = await optionsResponse.json();

    throw new Error(
      error?.error?.message || "Failed to generate login options"
    );
  }

  const { options }: LoginOptionsResponse =
    await optionsResponse.json();

  const authenticationResponse = await startAuthentication({
    optionsJSON: options,
  });

  const verifyResponse = await fetch(
    `${API_BASE_URL}/auth/login/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        response: authenticationResponse,
      }),
    }
  );

  if (!verifyResponse.ok) {
    const error = await verifyResponse.json();

    throw new Error(
      error?.error?.message || "WebAuthn login verification failed"
    );
  }

  return verifyResponse.json();
};

export interface AuthenticatedUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
  account_status: string;
  created_at: string;
}

interface MeResponse {
  success: boolean;
  user: AuthenticatedUser;
}

export const getCurrentUser = async (): Promise<AuthenticatedUser> => {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Not authenticated");
  }

  const data: MeResponse = await response.json();

  return data.user;
};

export const logoutUser = async (): Promise<void> => {
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

  const logoutResponse = await fetch(
    `${API_BASE_URL}/auth/logout`,
    {
      method: "POST",
      headers: {
        "x-csrf-token": csrfData.csrfToken,
      },
      credentials: "include",
    }
  );

  if (!logoutResponse.ok) {
    const error = await logoutResponse.json();

    throw new Error(
      error?.error?.message || "Logout failed"
    );
  }
};