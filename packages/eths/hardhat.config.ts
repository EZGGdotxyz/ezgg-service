import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-chai-matchers-viem";
import "hardhat-docgen";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  docgen: {
    path: "./docs", // 输出目录
    clear: true, // 是否清除旧文件
    runOnCompile: true, // 是否在编译时自动生成文档
  },
};

export default config;
