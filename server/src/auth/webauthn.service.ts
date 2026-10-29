import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { randomUUID } from "crypto";
import { User } from "../models/User";
import { webauthnConfig } from "../config/webauthn";
import { WebAuthnAuthenticationCredential } from "./webauthn.types";
import {
  checkAuthenticationThrottle,
  recordFailedAuthenticationAttempt,
  resetAuthenticationAttempts,
} from "../services/auth-failure.service";
import { AppError } from "../utils/AppError";

export const generateRegistrationOptionsForUser = async (
  name: string,
  email: string
) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const webauthnUserId = randomUUID();

  const options = await generateRegistrationOptions({
    rpName: webauthnConfig.rpName,
    rpID: webauthnConfig.rpID,
    userName: email,
    userDisplayName: name,
    userID: new TextEncoder().encode(webauthnUserId),

    attestationType: "none",

    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },

    supportedAlgorithmIDs: [-7, -257],
  });

  const authenticationCredential: WebAuthnAuthenticationCredential = {
    webauthnUserId,
    credentials: [],
    currentChallenge: options.challenge,
    challengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await User.create({
    name,
    email,
    role: "USER",
    authentication_credential: authenticationCredential,
    account_status: "PENDING",
  });

  return options;
};

export const verifyRegistrationForUser = async (
  email: string,
  response: Parameters<typeof verifyRegistrationResponse>[0]["response"]
) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.account_status !== "PENDING") {
    throw new Error("User registration is not pending");
  }

  const authenticationCredential =
    user.authentication_credential as unknown as WebAuthnAuthenticationCredential;

  if (
    !authenticationCredential.currentChallenge ||
    !authenticationCredential.challengeExpiresAt
  ) {
    throw new Error("Registration challenge is missing");
  }

  if (new Date() > new Date(authenticationCredential.challengeExpiresAt)) {
    throw new Error("Registration challenge has expired");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: authenticationCredential.currentChallenge,
    expectedOrigin: webauthnConfig.origin,
    expectedRPID: webauthnConfig.rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("WebAuthn registration verification failed");
  }

  const {
    credential,
    credentialDeviceType,
    credentialBackedUp,
  } = verification.registrationInfo;

  const storedCredential = {
    id: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: response.response.transports,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  };

  authenticationCredential.credentials.push(storedCredential);
  authenticationCredential.currentChallenge = undefined;
  authenticationCredential.challengeExpiresAt = undefined;

  user.authentication_credential = authenticationCredential;
  user.markModified("authentication_credential");

  user.account_status = "ACTIVE";
  await user.save();

  return {
    verified: true,
    userId: user.user_id,
  };
};

export const generateLoginOptionsForUser = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.account_status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  const authenticationCredential =
    user.authentication_credential as unknown as WebAuthnAuthenticationCredential;

  if (
    !authenticationCredential.webauthnUserId ||
    !authenticationCredential.credentials.length
  ) {
    throw new Error("No passkey registered for this user");
  }

  const options = await generateAuthenticationOptions({
    rpID: webauthnConfig.rpID,
    userVerification: "required",
    allowCredentials: authenticationCredential.credentials.map(
      (credential) => ({
        id: credential.id,
        transports: credential.transports as any,
      })
    ),
  });

  authenticationCredential.currentChallenge = options.challenge;
  authenticationCredential.challengeExpiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  user.authentication_credential = authenticationCredential;
  user.markModified("authentication_credential");

  await user.save();

  return options;
};

export const verifyLoginForUser = async (
  email: string,
  response: Parameters<
    typeof verifyAuthenticationResponse
  >[0]["response"]
) => {
  const identifier = email.toLowerCase().trim();

  const user = await User.findOne({
    email: identifier,
  });

  if (
    checkAuthenticationThrottle(identifier)
  ) {
    throw new AppError(
      429,
      "AUTHENTICATION_THROTTLED",
      "Authentication temporarily throttled due to repeated failed attempts"
    );
  }

  try {
    if (!user) {
      await recordFailedAuthenticationAttempt(
        identifier
      );

      throw new Error("User not found");
    }

    if (user.account_status !== "ACTIVE") {
      await recordFailedAuthenticationAttempt(
        identifier,
        user.user_id
      );

      throw new Error(
        "User account is not active"
      );
    }

    const authenticationCredential =
      user.authentication_credential as unknown as WebAuthnAuthenticationCredential;

    if (
      !authenticationCredential.currentChallenge ||
      !authenticationCredential.challengeExpiresAt
    ) {
      await recordFailedAuthenticationAttempt(
        identifier,
        user.user_id
      );

      throw new Error(
        "Login challenge is missing"
      );
    }

    if (
      new Date() >
      new Date(
        authenticationCredential.challengeExpiresAt
      )
    ) {
      await recordFailedAuthenticationAttempt(
        identifier,
        user.user_id
      );

      throw new Error(
        "Login challenge has expired"
      );
    }

    const credentialID = response.id;

    const storedCredential =
      authenticationCredential.credentials.find(
        (credential) =>
          credential.id === credentialID
      );

    if (!storedCredential) {
      await recordFailedAuthenticationAttempt(
        identifier,
        user.user_id
      );

      throw new Error(
        "Passkey credential not found"
      );
    }

    const verification =
      await verifyAuthenticationResponse({
        response,
        expectedChallenge:
          authenticationCredential.currentChallenge,
        expectedOrigin:
          webauthnConfig.origin,
        expectedRPID:
          webauthnConfig.rpID,
        credential: {
          id: storedCredential.id,
          publicKey: Buffer.from(
            storedCredential.publicKey,
            "base64"
          ),
          counter:
            storedCredential.counter,
          transports:
            storedCredential.transports as any,
        },
        requireUserVerification: true,
      });

    if (!verification.verified) {
      await recordFailedAuthenticationAttempt(
        identifier,
        user.user_id
      );

      throw new Error(
        "WebAuthn authentication failed"
      );
    }

    storedCredential.counter =
      verification.authenticationInfo.newCounter;

    authenticationCredential.currentChallenge =
      undefined;

    authenticationCredential.challengeExpiresAt =
      undefined;

    user.authentication_credential =
      authenticationCredential;

    await user.save();

    resetAuthenticationAttempts(
      identifier
    );

    return {
      verified: true,
      userId: user.user_id,
      role: user.role,
    };
  } catch (error) {
    throw error;
  }
};