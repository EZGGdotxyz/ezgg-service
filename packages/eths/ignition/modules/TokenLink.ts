import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
// Base Sepolia 84532
// const FEE_MASTER_ADDRESS = "0xC65821FB3A0C1c6962a8cd5422cd65f6A3998ceA";
// Polygon Amoy 80002
const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";

const TokenLinkModule = buildModule("TokenLinkModule", (m) => {
  const tokenLink = m.contract("TokenLink", [
    CONTRACT_OWNER,
    FEE_MASTER_ADDRESS,
  ]);
  return { tokenLink };
});

export default TokenLinkModule;
