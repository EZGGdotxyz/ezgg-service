import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// 开发测试
const CONTRACT_OWNER: string = process.env.CONTRACT_OWNER!;

// 生产
// const CONTRACT_OWNER: string = process.env.EGZZ_ONWER!;

const FeeMasterModule = buildModule("FeeMasterModule", (m) => {
  const feeMaster = m.contract("FeeMaster", [CONTRACT_OWNER]);
  return { feeMaster };
});

export default FeeMasterModule;
