import { createHash } from "crypto";

export const generateSha256Hash = (
  nonce: Buffer,
  ciphertext: Buffer,
  authTag: Buffer
): string => {
  const encryptedRepresentation = Buffer.concat([
    nonce,
    ciphertext,
    authTag,
  ]);

  return createHash("sha256")
    .update(encryptedRepresentation)
    .digest("hex");
};