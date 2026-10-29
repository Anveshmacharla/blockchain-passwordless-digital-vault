import "dotenv/config";

import {
  blockchainContract,
  getBlockchainProvider,
} from "./blockchain.service";

async function main() {
  const provider = getBlockchainProvider();

  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  const admin = await blockchainContract.admin();

  console.log("Connected to chain ID:", network.chainId.toString());
  console.log("Current block number:", blockNumber);
  console.log("Contract admin:", admin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});