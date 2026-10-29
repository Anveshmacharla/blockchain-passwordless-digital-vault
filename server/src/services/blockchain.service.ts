import { ethers } from "ethers";

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
const serviceWalletAddress =
  process.env.BLOCKCHAIN_SERVICE_WALLET_ADDRESS;

if (!rpcUrl) {
  throw new Error("BLOCKCHAIN_RPC_URL is not defined");
}

if (!contractAddress) {
  throw new Error("BLOCKCHAIN_CONTRACT_ADDRESS is not defined");
}

if (!serviceWalletAddress) {
  throw new Error(
    "BLOCKCHAIN_SERVICE_WALLET_ADDRESS is not defined"
  );
}

const contractAbi = [
  "function registerFile(string fileId, bytes32 sha256Hash, address ownerAddress) external",
  "function updateHash(string fileId, bytes32 newSha256Hash) external",
  "function updateStatus(string fileId, uint8 newStatus) external",
  "function getFileRecord(string fileId) external view returns (string, bytes32, address, uint8, uint256)",
  "function admin() external view returns (address)",
];

const provider = new ethers.JsonRpcProvider(rpcUrl);

const signer = new ethers.JsonRpcSigner(
  provider,
  serviceWalletAddress
);

export const blockchainContract = new ethers.Contract(
  contractAddress,
  contractAbi,
  signer
);

export const getBlockchainProvider = () => provider;

export const getBlockchainContractAddress = () =>
  contractAddress;

export const getBlockchainServiceWalletAddress = () =>
  serviceWalletAddress;

export const registerFileOnBlockchain = async (
  fileId: string,
  sha256Hash: string,
  ownerAddress: string
) => {
  const contract = await blockchainContract;

  const transaction = await contract.getFunction(
    "registerFile"
  )(
    fileId,
    sha256Hash,
    ownerAddress
  );

  const receipt = await transaction.wait();

  return {
    transactionHash: transaction.hash,
    blockNumber: receipt?.blockNumber,
  };
};

export const updateFileHashOnBlockchain = async (
  fileId: string,
  sha256Hash: string
) => {
  const contract = await blockchainContract;

  const transaction = await contract.getFunction(
    "updateHash"
  )(fileId, sha256Hash);

  const receipt = await transaction.wait();

  return {
    transactionHash: transaction.hash,
    blockNumber: receipt?.blockNumber,
  };
};

export const updateFileStatusOnBlockchain = async (
  fileId: string,
  status: number
) => {
  const contract = await blockchainContract;

  const transaction = await contract.getFunction(
    "updateStatus"
  )(fileId, status);

  const receipt = await transaction.wait();

  return {
    transactionHash: transaction.hash,
    blockNumber: receipt?.blockNumber,
  };
};

export const getFileRecordFromBlockchain = async (
  fileId: string
) => {
  const contract = await blockchainContract;

  return contract.getFunction("getFileRecord")(fileId);
};