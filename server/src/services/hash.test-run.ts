import { randomBytes } from "crypto";

import { generateSha256Hash } from "./hash.service";

const runHashTest = (): void => {
  console.log("1. Creating test encrypted representation...");

  const nonce = randomBytes(12);
  const ciphertext = Buffer.from(
    "This represents encrypted file data."
  );
  const authTag = randomBytes(16);

  console.log("Nonce length:", nonce.length, "bytes");
  console.log("Ciphertext length:", ciphertext.length, "bytes");
  console.log("Authentication tag length:", authTag.length, "bytes");

  console.log("\n2. Generating SHA-256 hash...");

  const hash1 = generateSha256Hash(
    nonce,
    ciphertext,
    authTag
  );

  console.log("SHA-256 hash:", hash1);
  console.log("Hash length:", hash1.length, "characters");
  console.log(
    "Valid SHA-256 length:",
    hash1.length === 64
  );

  console.log("\n3. Testing deterministic hashing...");

  const hash2 = generateSha256Hash(
    nonce,
    ciphertext,
    authTag
  );

  console.log("Second hash:", hash2);
  console.log(
    "Hashes match:",
    hash1 === hash2
  );

  console.log("\n4. Testing tamper detection...");

  const modifiedCiphertext = Buffer.from(ciphertext);
  modifiedCiphertext[0] ^= 1;

  const tamperedHash = generateSha256Hash(
    nonce,
    modifiedCiphertext,
    authTag
  );

  console.log("Tampered hash:", tamperedHash);
  console.log(
    "Hash changed:",
    hash1 !== tamperedHash
  );

  console.log("\n5. Testing hash format...");

  const hashBuffer = Buffer.from(hash1, "hex");

  const expectedLength = 32;

  console.log(
    "Hash binary length:",
    hashBuffer.length,
    "bytes"
  );

  console.log(
    "Valid SHA-256 binary length:",
    hashBuffer.length === expectedLength
  );

  console.log("\nSHA-256 integrity test completed.");
};

runHashTest();