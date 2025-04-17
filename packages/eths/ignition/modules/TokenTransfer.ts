import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
// Base Sepolia 84532
// const FEE_MASTER_ADDRESS = "0xC65821FB3A0C1c6962a8cd5422cd65f6A3998ceA";
// Polygon Amoy 80002
// const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";
// BNB Testnet 97
// const FEE_MASTER_ADDRESS = "0x57ADB4656428e6D804249A77AEcD95b10cbC353A";
// Arbitrum Sepolia 421614
// const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";
// Scroll Sepolia 534351
// const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";
// Monad Testnet 10143
const FEE_MASTER_ADDRESS = "0x469798aF201bec7ab2A7F9A58174EC730afE7016";

// 生产
// const CONTRACT_OWNER: string = process.env.EGZZ_ONWER!;
// Base 8453
// const FEE_MASTER_ADDRESS = "0x2007b3764D226E88Cb6920895c62184E17154680";

const TokenTransferModule = buildModule("TokenTransferModule", (m) => {
  const tokenTransfer = m.contract("TokenTransfer", [
    CONTRACT_OWNER,
    FEE_MASTER_ADDRESS,
  ]);
  return { tokenTransfer };
});

export default TokenTransferModule;
