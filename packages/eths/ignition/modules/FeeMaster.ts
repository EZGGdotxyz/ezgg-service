import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;
const DEPLOYER_PRIVATE_KEY: string = process.env.DEPLOYER_PRIVATE_KEY!;

const FeeMasterModule = buildModule("FeeMasterModule", (m) => {
  const feeMaster = m.contract("FeeMaster", [CONTRACT_OWNER]);
  return { feeMaster };
});

export default FeeMasterModule;
