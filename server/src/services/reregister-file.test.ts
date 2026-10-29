import "dotenv/config";

import {
  registerFileOnBlockchain,
  getBlockchainServiceWalletAddress,
} from "./blockchain.service";

async function main() {
  const fileId =
    "a858ffd6-4333-4816-bcdb-7e03423832c8";

  const sha256Hash =
    "fa977bd02a46502ea1d9e5d661ad0c84a19d62c7f0e066e868368881e4a8dbc6";

  const ownerAddress =
    getBlockchainServiceWalletAddress();

  console.log("Registering existing file...");
  console.log("File ID:", fileId);
  console.log("SHA-256:", sha256Hash);
  console.log("Owner:", ownerAddress);

  const result =
    await registerFileOnBlockchain(
      fileId,
      `0x${sha256Hash}`,
      ownerAddress
    );

  console.log(
    "Transaction hash:",
    result.transactionHash
  );

  console.log(
    "Block number:",
    result.blockNumber
  );

  console.log(
    "File registration completed."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});