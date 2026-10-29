import { getFileRecordFromBlockchain } from "./blockchain.service";
import { readEncryptedFile } from "./storage.service";
import { generateSha256Hash } from "./hash.service";

const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export const verifyFileIntegrity = async (
  vaultId: string,
  fileId: string
) => {
  // Read the complete encrypted file representation
  const encryptedFile = await readEncryptedFile(
    vaultId,
    fileId
  );

  if (
    encryptedFile.length <
    NONCE_LENGTH + AUTH_TAG_LENGTH
  ) {
    throw new Error(
      "Invalid encrypted file representation"
    );
  }

  // Extract nonce
  const nonce = encryptedFile.subarray(
    0,
    NONCE_LENGTH
  );

  // Extract authentication tag
  const authTag = encryptedFile.subarray(
    encryptedFile.length - AUTH_TAG_LENGTH
  );

  // Extract ciphertext
  const ciphertext = encryptedFile.subarray(
    NONCE_LENGTH,
    encryptedFile.length - AUTH_TAG_LENGTH
  );

  // Generate SHA-256 using:
  // nonce || ciphertext || authentication tag
  const calculatedHash = generateSha256Hash(
    nonce,
    ciphertext,
    authTag
  );

  // Read the trusted hash from blockchain
  const blockchainRecord =
    await getFileRecordFromBlockchain(fileId);

  const blockchainHash =
    blockchainRecord[1];

  // Convert calculated SHA-256 hex string
  // to the same 0x-prefixed representation
  // returned by the Solidity bytes32 value.
  const normalizedCalculatedHash =
    `0x${calculatedHash}`;

  const verified =
    normalizedCalculatedHash.toLowerCase() ===
    blockchainHash.toLowerCase();

  return {
    verified,
    calculatedHash,
    blockchainHash,
    status: verified
      ? "VERIFIED"
      : "TAMPERED",
  };
};