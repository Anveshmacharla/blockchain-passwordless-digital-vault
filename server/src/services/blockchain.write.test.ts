import "dotenv/config";

import { ethers } from "ethers";

const rpcUrl: string = process.env.BLOCKCHAIN_RPC_URL ?? "";
const contractAddress: string =
  process.env.BLOCKCHAIN_CONTRACT_ADDRESS ?? "";

if (rpcUrl === "") {
  throw new Error("BLOCKCHAIN_RPC_URL is not defined");
}

if (contractAddress === "") {
  throw new Error("BLOCKCHAIN_CONTRACT_ADDRESS is not defined");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);

const deployerAddress: string =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const contractAbi = [
  "function registerFile(string fileId, bytes32 sha256Hash, address ownerAddress) external",
  "function getFileRecord(string fileId) external view returns (string, bytes32, address, uint8, uint256)",
];

async function main() {
  const signer = await provider.getSigner(deployerAddress);

  const contract = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );

  const testFileId = "test-file-001";

  const testHash = ethers.keccak256(
    ethers.toUtf8Bytes("test encrypted file")
  );

  console.log("Registering test file...");
  console.log("File ID:", testFileId);
  console.log("Hash:", testHash);

  const transaction = await contract.registerFile(
    testFileId,
    testHash,
    deployerAddress
  );

  console.log("Transaction hash:", transaction.hash);

  const receipt = await transaction.wait();

  console.log("Transaction confirmed in block:", receipt?.blockNumber);

  const record = await contract.getFileRecord(testFileId);

  console.log("Stored file ID:", record[0]);
  console.log("Stored hash:", record[1]);
  console.log("Stored owner:", record[2]);
  console.log("Stored status:", record[3].toString());
  console.log("Stored timestamp:", record[4].toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});