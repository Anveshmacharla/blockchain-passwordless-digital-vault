import {
  access,
  rm,
} from "fs/promises";
import path from "path";

import {
  createFileStorageDirectory,
  writeEncryptedFile,
  writeWrappedKey,
  readEncryptedFile,
  readWrappedKey,
  encryptedFileExists,
  deleteFileStorage,
} from "./storage.service";

const runStorageTest = async (): Promise<void> => {
  const testVaultId = "storage-test-vault";
  const testFileId = "storage-test-file";

  const testEncryptedData = Buffer.from(
    "Encrypted file test data"
  );

  const testWrappedKey = Buffer.from(
    "Wrapped DEK test data"
  );

  console.log("1. Creating storage directory...");

  const directory =
    await createFileStorageDirectory(
      testVaultId,
      testFileId
    );

  console.log(
    "Directory created:",
    directory
  );

  console.log("2. Writing data.enc...");

  const dataPath =
    await writeEncryptedFile(
      testVaultId,
      testFileId,
      testEncryptedData
    );

  console.log(
    "data.enc created:",
    dataPath
  );

  console.log("3. Writing key.wrap...");

  const keyPath =
    await writeWrappedKey(
      testVaultId,
      testFileId,
      testWrappedKey
    );

  console.log(
    "key.wrap created:",
    keyPath
  );

  console.log("4. Checking encrypted file...");

  const exists =
    await encryptedFileExists(
      testVaultId,
      testFileId
    );

  console.log(
    "data.enc exists:",
    exists
  );

  console.log("5. Reading data.enc...");

  const storedData =
    await readEncryptedFile(
      testVaultId,
      testFileId
    );

  console.log(
    "data.enc contents match:",
    storedData.equals(
      testEncryptedData
    )
  );

  console.log("6. Reading key.wrap...");

  const storedKey =
    await readWrappedKey(
      testVaultId,
      testFileId
    );

  console.log(
    "key.wrap contents match:",
    storedKey.equals(
      testWrappedKey
    )
  );

  console.log(
    "7. Testing invalid path protection..."
  );

  try {
    await createFileStorageDirectory(
      "../invalid-vault",
      testFileId
    );

    console.log(
      "ERROR: Invalid path was accepted"
    );
  } catch {
    console.log(
      "Invalid path rejected successfully"
    );
  }

  console.log("8. Deleting stored files...");

  await deleteFileStorage(
    testVaultId,
    testFileId
  );

  const dataExistsAfterDelete =
    await encryptedFileExists(
      testVaultId,
      testFileId
    );

  console.log(
    "data.enc exists after deletion:",
    dataExistsAfterDelete
  );

  console.log(
    "9. Cleaning up test directory..."
  );

  await rm(
    path.dirname(dataPath),
    {
      recursive: true,
      force: true,
    }
  );

  try {
    await access(dataPath);
    console.log(
      "ERROR: Test directory still exists"
    );
  } catch {
    console.log(
      "Test directory removed successfully"
    );
  }

  console.log(
    "Filesystem storage test completed."
  );
};

runStorageTest().catch((error) => {
  console.error(
    "Filesystem storage test failed:",
    error
  );

  process.exit(1);
});