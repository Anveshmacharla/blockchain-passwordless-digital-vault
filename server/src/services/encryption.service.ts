import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

const AES_ALGORITHM = "aes-256-gcm";
const AES_KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const kekBase64 = process.env.VAULT_KEK_BASE64;

if (!kekBase64) {
  throw new Error("VAULT_KEK_BASE64 is not defined");
}

const KEK = Buffer.from(kekBase64, "base64");

if (KEK.length !== AES_KEY_LENGTH) {
  throw new Error("VAULT_KEK_BASE64 must decode to exactly 32 bytes");
}

export interface EncryptedData {
  nonce: Buffer;
  ciphertext: Buffer;
  authTag: Buffer;
}

export const generateDataEncryptionKey = (): Buffer => {
  return randomBytes(AES_KEY_LENGTH);
};

export const encryptData = (
  data: Buffer,
  dek: Buffer
): EncryptedData => {
  if (dek.length !== AES_KEY_LENGTH) {
    throw new Error("DEK must be exactly 32 bytes");
  }

  const nonce = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    AES_ALGORITHM,
    dek,
    nonce,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  const ciphertext = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    nonce,
    ciphertext,
    authTag,
  };
};

export const decryptData = (
  encryptedData: EncryptedData,
  dek: Buffer
): Buffer => {
  if (dek.length !== AES_KEY_LENGTH) {
    throw new Error("DEK must be exactly 32 bytes");
  }

  const decipher = createDecipheriv(
    AES_ALGORITHM,
    dek,
    encryptedData.nonce,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  decipher.setAuthTag(encryptedData.authTag);

  return Buffer.concat([
    decipher.update(encryptedData.ciphertext),
    decipher.final(),
  ]);
};

export const wrapDataEncryptionKey = (
  dek: Buffer
): Buffer => {
  if (dek.length !== AES_KEY_LENGTH) {
    throw new Error("DEK must be exactly 32 bytes");
  }

  const nonce = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    AES_ALGORITHM,
    KEK,
    nonce,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  const wrappedKey = Buffer.concat([
    cipher.update(dek),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    nonce,
    wrappedKey,
    authTag,
  ]);
};

export const unwrapDataEncryptionKey = (
  wrappedKey: Buffer
): Buffer => {
  const expectedLength =
    IV_LENGTH +
    AES_KEY_LENGTH +
    AUTH_TAG_LENGTH;

  if (wrappedKey.length !== expectedLength) {
    throw new Error(
      "Invalid wrapped DEK length"
    );
  }

  const nonce = wrappedKey.subarray(
    0,
    IV_LENGTH
  );

  const wrappedDek = wrappedKey.subarray(
    IV_LENGTH,
    IV_LENGTH + AES_KEY_LENGTH
  );

  const authTag = wrappedKey.subarray(
    IV_LENGTH + AES_KEY_LENGTH
  );

  const decipher = createDecipheriv(
    AES_ALGORITHM,
    KEK,
    nonce,
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(wrappedDek),
    decipher.final(),
  ]);
};