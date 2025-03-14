import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
const FEE_MASTER_ADDRESS = "0xC65821FB3A0C1c6962a8cd5422cd65f6A3998ceA";

const TokenLinkModule = buildModule("TokenLinkModule", (m) => {
  const tokenLink = m.contract("TokenLink", [
    CONTRACT_OWNER,
    FEE_MASTER_ADDRESS,
  ]);
  return { tokenLink };
});

export default TokenLinkModule;
