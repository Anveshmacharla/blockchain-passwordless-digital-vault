export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceType?: string;
  backedUp?: boolean;
}

export interface WebAuthnAuthenticationCredential {
  [key: string]: unknown;

  webauthnUserId: string;
  credentials: WebAuthnCredential[];
  currentChallenge?: string;
  challengeExpiresAt?: Date;
}