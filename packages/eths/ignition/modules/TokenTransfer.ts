import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
// Base Sepolia 84532
// const FEE_MASTER_ADDRESS = "0xC65821FB3A0C1c6962a8cd5422cd65f6A3998ceA";
// Polygon Amoy 80002
// const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";

// 生产
const CONTRACT_OWNER: string = process.env.EGZZ_ONWER!;
// Base 8453
const FEE_MASTER_ADDRESS = "0x2007b3764D226E88Cb6920895c62184E17154680";

const TokenTransferModule = buildModule("TokenTransferModule", (m) => {
  const tokenTransfer = m.contract("TokenTransfer", [
    CONTRACT_OWNER,
    FEE_MASTER_ADDRESS,
  ]);
  return { tokenTransfer };
});

export default TokenTransferModule;
