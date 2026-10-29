import "dotenv/config";

import {
  generateDataEncryptionKey,
  encryptData,
} from "./encryption.service";

import {
  writeEncryptedFile,
} from "./storage.service";

import {
  generateSha256Hash,
} from "./hash.service";

import {
  registerFileOnBlockchain,
} from "./blockchain.service";

import {
  verifyFileIntegrity,
} from "./integrity.service";

async function main() {
  const vaultId = "verification-test-vault";
  const fileId = "verification-test-file";

  const ownerAddress =
    process.env.BLOCKCHAIN_SERVICE_WALLET_ADDRESS;

  if (!ownerAddress) {
    throw new Error(
      "BLOCKCHAIN_SERVICE_WALLET_ADDRESS is not defined"
    );
  }

  const originalData = Buffer.from(
    "Blockchain Digital Vault integrity test"
  );

  console.log("1. Generating DEK...");

  const dek = generateDataEncryptionKey();

  console.log(
    "DEK generated:",
    dek.length,
    "bytes"
  );

  console.log("\n2. Encrypting test file...");

  const encrypted = encryptData(
    originalData,
    dek
  );

  const encryptedRepresentation = Buffer.concat([
    encrypted.nonce,
    encrypted.ciphertext,
    encrypted.authTag,
  ]);

  console.log(
    "Encrypted representation:",
    encryptedRepresentation.length,
    "bytes"
  );

  console.log("\n3. Generating SHA-256 hash...");

  const sha256Hash = generateSha256Hash(
    encrypted.nonce,
    encrypted.ciphertext,
    encrypted.authTag
  );

  console.log(
    "SHA-256:",
    sha256Hash
  );

  console.log("\n4. Registering hash on blockchain...");

  const blockchainResult =
    await registerFileOnBlockchain(
      fileId,
      `0x${sha256Hash}`,
      ownerAddress
    );

  console.log(
    "Transaction hash:",
    blockchainResult.transactionHash
  );

  console.log(
    "Block number:",
    blockchainResult.blockNumber
  );

  console.log("\n5. Writing encrypted file...");

  await writeEncryptedFile(
    vaultId,
    fileId,
    encryptedRepresentation
  );

  console.log("Encrypted file written.");

  console.log("\n6. Verifying file integrity...");

  const result = await verifyFileIntegrity(
    vaultId,
    fileId
  );

  console.log(
    "Calculated hash:",
    result.calculatedHash
  );

  console.log(
    "Blockchain hash:",
    result.blockchainHash
  );

  console.log(
    "Verification status:",
    result.status
  );

  console.log(
    "Verified:",
    result.verified
  );

  if (!result.verified) {
    throw new Error(
      "Integrity verification failed"
    );
  }

  console.log(
    "\nIntegrity verification test PASSED."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});