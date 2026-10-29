import dotenv from "dotenv";
import { timingSafeEqual } from "crypto";

dotenv.config();

const runEncryptionTest = async (): Promise<void> => {
  const {
    generateDataEncryptionKey,
    encryptData,
    decryptData,
    wrapDataEncryptionKey,
    unwrapDataEncryptionKey,
  } = await import("./encryption.service");

  const originalData = Buffer.from(
    "This is a test file for AES-256-GCM encryption."
  );

  console.log("1. Generating DEK...");

  const dek = generateDataEncryptionKey();

  console.log("DEK length:", dek.length, "bytes");

  console.log("2. Encrypting data...");

  const encrypted = encryptData(
    originalData,
    dek
  );

  console.log(
    "Nonce length:",
    encrypted.nonce.length
  );

  console.log(
    "Ciphertext length:",
    encrypted.ciphertext.length
  );

  console.log(
    "Authentication tag length:",
    encrypted.authTag.length
  );

  console.log("3. Decrypting data...");

  const decrypted = decryptData(
    encrypted,
    dek
  );

  console.log(
    "Decryption successful:",
    decrypted.equals(originalData)
  );

  console.log("4. Wrapping DEK...");

  const wrappedDek =
    wrapDataEncryptionKey(dek);

  console.log(
    "Wrapped DEK length:",
    wrappedDek.length,
    "bytes"
  );

  console.log("5. Unwrapping DEK...");

  const recoveredDek =
    unwrapDataEncryptionKey(wrappedDek);

  console.log(
    "Recovered DEK matches original:",
    timingSafeEqual(
      dek,
      recoveredDek
    )
  );

  console.log("6. Testing tamper detection...");

  const tamperedCiphertext =
    Buffer.from(encrypted.ciphertext);

  tamperedCiphertext[0] ^= 1;

  try {
    decryptData(
      {
        nonce: encrypted.nonce,
        ciphertext: tamperedCiphertext,
        authTag: encrypted.authTag,
      },
      dek
    );

    console.log(
      "ERROR: Tampered data was accepted"
    );
  } catch {
    console.log(
      "Tamper detection successful: authentication failed"
    );
  }

  console.log(
    "Encryption test completed."
  );
};

runEncryptionTest().catch((error) => {
  console.error(
    "Encryption test failed:",
    error
  );

  process.exit(1);
});