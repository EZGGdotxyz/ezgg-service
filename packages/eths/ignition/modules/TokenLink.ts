import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
const FEE_MASTER_ADDRESS = "0x1FE66e50eb22C624337F1c8175c6618d96C571a9";

const TokenLinkModule = buildModule("TokenLinkModule", (m) => {
  const tokenLink = m.contract("TokenLink", [
    CONTRACT_OWNER,
    FEE_MASTER_ADDRESS,
  ]);
  return { tokenLink };
});

export default TokenLinkModule;
