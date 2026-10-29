import "dotenv/config";

import {
  registerFileOnBlockchain,
  updateFileHashOnBlockchain,
  updateFileStatusOnBlockchain,
  getFileRecordFromBlockchain,
} from "./blockchain.service";

async function main() {
  const fileId = "service-test-file-001";

  const originalHash =
    "0x1111111111111111111111111111111111111111111111111111111111111111";

  const updatedHash =
    "0x2222222222222222222222222222222222222222222222222222222222222222";

  const ownerAddress =
    process.env.BLOCKCHAIN_SERVICE_WALLET_ADDRESS;

  if (!ownerAddress) {
    throw new Error(
      "BLOCKCHAIN_SERVICE_WALLET_ADDRESS is not defined"
    );
  }

  console.log("1. Registering file...");

  const registration =
    await registerFileOnBlockchain(
      fileId,
      originalHash,
      ownerAddress
    );

  console.log(
    "Transaction hash:",
    registration.transactionHash
  );

  console.log(
    "Block number:",
    registration.blockNumber
  );

  console.log("\n2. Reading registered file...");

  let record =
    await getFileRecordFromBlockchain(fileId);

  console.log("File ID:", record[0]);
  console.log("Hash:", record[1]);
  console.log("Owner:", record[2]);
  console.log("Status:", record[3].toString());

  console.log("\n3. Updating file hash...");

  const hashUpdate =
    await updateFileHashOnBlockchain(
      fileId,
      updatedHash
    );

  console.log(
    "Transaction hash:",
    hashUpdate.transactionHash
  );

  console.log(
    "Block number:",
    hashUpdate.blockNumber
  );

  console.log("\n4. Reading updated file...");

  record =
    await getFileRecordFromBlockchain(fileId);

  console.log("File ID:", record[0]);
  console.log("Updated hash:", record[1]);
  console.log("Owner:", record[2]);
  console.log("Status:", record[3].toString());

  console.log("\n5. Updating file status to REVOKED...");

  const statusUpdate =
    await updateFileStatusOnBlockchain(
      fileId,
      1
    );

  console.log(
    "Transaction hash:",
    statusUpdate.transactionHash
  );

  console.log(
    "Block number:",
    statusUpdate.blockNumber
  );

  console.log("\n6. Reading final record...");

  record =
    await getFileRecordFromBlockchain(fileId);

  console.log("File ID:", record[0]);
  console.log("Hash:", record[1]);
  console.log("Owner:", record[2]);
  console.log("Status:", record[3].toString());
  console.log("Timestamp:", record[4].toString());

  console.log("\nBlockchain service test completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});