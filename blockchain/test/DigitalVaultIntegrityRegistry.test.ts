import { expect } from "chai";
import { network } from "hardhat";
import type { DigitalVaultIntegrityRegistry } from "../types/ethers-contracts/DigitalVaultIntegrityRegistry.js";

describe("DigitalVaultIntegrityRegistry", function () {
  async function deployContract() {
    const { ethers } = await network.create();

    const [admin, otherUser] =
      await ethers.getSigners();

    const registry =
      await ethers.deployContract(
        "DigitalVaultIntegrityRegistry"
      ) as unknown as DigitalVaultIntegrityRegistry;

    await registry.waitForDeployment();

    return {
      registry,
      admin,
      otherUser,
      ethers,
    };
  }

  it("should set the deployer as admin", async function () {
    const {
      registry,
      admin,
    } = await deployContract();

    expect(
      await registry.admin()
    ).to.equal(admin.address);
  });

  it("should register a file", async function () {
    const {
      registry,
      admin,
      ethers,
    } = await deployContract();

    const fileId = "test-file-001";

    const sha256Hash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "test encrypted file"
        )
      );

    await registry.registerFile(
      fileId,
      sha256Hash,
      admin.address
    );

    const record =
      await registry.getFileRecord(fileId);

    expect(record[0]).to.equal(fileId);
    expect(record[1]).to.equal(sha256Hash);
    expect(record[2]).to.equal(admin.address);
    expect(record[3]).to.equal(0n);
  });

  it("should reject duplicate file registration", async function () {
    const {
      registry,
      admin,
      ethers,
    } = await deployContract();

    const fileId = "test-file-002";

    const sha256Hash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "test encrypted file"
        )
      );

    await registry.registerFile(
      fileId,
      sha256Hash,
      admin.address
    );

    await expect(
      registry.registerFile(
        fileId,
        sha256Hash,
        admin.address
      )
    ).to.be.revertedWith(
      "File already registered"
    );
  });

  it("should update the file hash", async function () {
    const {
      registry,
      admin,
      ethers,
    } = await deployContract();

    const fileId = "test-file-003";

    const originalHash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "original encrypted file"
        )
      );

    const newHash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "updated encrypted file"
        )
      );

    await registry.registerFile(
      fileId,
      originalHash,
      admin.address
    );

    await registry.updateHash(
      fileId,
      newHash
    );

    const record =
      await registry.getFileRecord(fileId);

    expect(record[1]).to.equal(newHash);
  });

  it("should update the file status", async function () {
    const {
      registry,
      admin,
      ethers,
    } = await deployContract();

    const fileId = "test-file-004";

    const sha256Hash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "test encrypted file"
        )
      );

    await registry.registerFile(
      fileId,
      sha256Hash,
      admin.address
    );

    await registry.updateStatus(
      fileId,
      1
    );

    const record =
      await registry.getFileRecord(fileId);

    expect(record[3]).to.equal(1n);
  });

  it("should reject non-admin modifications", async function () {
    const {
      registry,
      admin,
      otherUser,
      ethers,
    } = await deployContract();

    const fileId = "test-file-005";

    const sha256Hash =
      ethers.keccak256(
        ethers.toUtf8Bytes(
          "test encrypted file"
        )
      );

    await registry.registerFile(
      fileId,
      sha256Hash,
      admin.address
    );

    const unauthorizedRegistry =
      registry.connect(otherUser);

    await expect(
      unauthorizedRegistry.updateHash(
        fileId,
        sha256Hash
      )
    ).to.be.revertedWith(
      "Only admin can perform this action"
    );
  });
});