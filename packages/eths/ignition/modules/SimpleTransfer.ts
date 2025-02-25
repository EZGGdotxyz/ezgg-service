import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleTransferModule = buildModule("SimpleTransferModule", (m) => {
  const simpleTransfer = m.contract("SimpleTransfer");
  return { simpleTransfer };
});

export default SimpleTransferModule;
