import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  const deployerAddress =
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const signer = await provider.getSigner(deployerAddress);

  const artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/DigitalVaultIntegrityRegistry.sol/DigitalVaultIntegrityRegistry.json",
      "utf8"
    )
  );

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  console.log("Deploying with account:", deployerAddress);

  const registry = await factory.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log("Contract deployed to:", contractAddress);

  const adminContract = new ethers.Contract(
    contractAddress,
    ["function admin() view returns (address)"],
    provider
  );

  const admin = await adminContract.admin();

  console.log("Contract admin:", admin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});