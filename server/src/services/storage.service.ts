import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  access,
} from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.resolve(
  process.cwd(),
  "..",
  "storage",
  "vaults"
);

const ensureStorageRoot = async (): Promise<void> => {
  await mkdir(STORAGE_ROOT, {
    recursive: true,
  });
};

const validatePathSegment = (
  value: string,
  fieldName: string
): void => {
  if (
    !value ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("..")
  ) {
    throw new Error(
      `Invalid ${fieldName}`
    );
  }
};

const getFileDirectory = (
  vaultId: string,
  fileId: string
): string => {
  validatePathSegment(vaultId, "vault ID");
  validatePathSegment(fileId, "file ID");

  return path.join(
    STORAGE_ROOT,
    vaultId,
    fileId
  );
};

export const createFileStorageDirectory = async (
  vaultId: string,
  fileId: string
): Promise<string> => {
  const directory = getFileDirectory(
    vaultId,
    fileId
  );

  await mkdir(directory, {
    recursive: true,
  });

  return directory;
};

export const writeEncryptedFile = async (
  vaultId: string,
  fileId: string,
  data: Buffer
): Promise<string> => {
  const directory =
    await createFileStorageDirectory(
      vaultId,
      fileId
    );

  const filePath = path.join(
    directory,
    "data.enc"
  );

  await writeFile(filePath, data);

  return filePath;
};

export const writeWrappedKey = async (
  vaultId: string,
  fileId: string,
  wrappedKey: Buffer
): Promise<string> => {
  const directory =
    await createFileStorageDirectory(
      vaultId,
      fileId
    );

  const keyPath = path.join(
    directory,
    "key.wrap"
  );

  await writeFile(keyPath, wrappedKey);

  return keyPath;
};

export const readEncryptedFile = async (
  vaultId: string,
  fileId: string
): Promise<Buffer> => {
  const directory = getFileDirectory(
    vaultId,
    fileId
  );

  const filePath = path.join(
    directory,
    "data.enc"
  );

  return readFile(filePath);
};

export const readWrappedKey = async (
  vaultId: string,
  fileId: string
): Promise<Buffer> => {
  const directory = getFileDirectory(
    vaultId,
    fileId
  );

  const keyPath = path.join(
    directory,
    "key.wrap"
  );

  return readFile(keyPath);
};

export const encryptedFileExists = async (
  vaultId: string,
  fileId: string
): Promise<boolean> => {
  try {
    const directory = getFileDirectory(
      vaultId,
      fileId
    );

    await access(
      path.join(directory, "data.enc")
    );

    return true;
  } catch {
    return false;
  }
};

export const deleteFileStorage = async (
  vaultId: string,
  fileId: string
): Promise<void> => {
  const directory = getFileDirectory(
    vaultId,
    fileId
  );

  const dataPath = path.join(
    directory,
    "data.enc"
  );

  const keyPath = path.join(
    directory,
    "key.wrap"
  );

  await Promise.all([
    unlink(dataPath).catch(() => undefined),
    unlink(keyPath).catch(() => undefined),
  ]);
};