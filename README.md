# 编译打包
## eths
### 编译
```
pnpm -F @crypto-transfer/eths compile
```
### 测试
```
pnpm -F @crypto-transfer/eths test
```
### 部署
```
cd packages/eths
# BASE SEPOLIA上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network baseSepolia --verify
# BASE SEPOLIA上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network baseSepolia --verify
# BASE SEPOLIA上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network baseSepolia --verify

# Polygon Amoy上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network polygonAmoy --verify
# Polygon Amoy上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network polygonAmoy --verify
# Polygon Amoy上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network polygonAmoy --verify

# BNB Testnet上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network bnbTestnet --verify
# BNB Testnet上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network bnbTestnet --verify
# BNB Testnet上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network bnbTestnet --verify

# Monad Testnet上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network monadTestnet --verify
# Monad Testnet上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network monadTestnet --verify
# Monad Testnet上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network monadTestnet --verify

# Arbitrum Sepolia上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network arbitrumSepolia --verify
# Arbitrum Sepolia上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network arbitrumSepolia --verify
# Arbitrum Sepolia上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network arbitrumSepolia --verify

# Scroll Sepolia 上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network scrollSepolia --verify
# Scroll Sepolia 上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network scrollSepolia --verify
# Scroll Sepolia 上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network scrollSepolia --verify

# BASE 上部署并验证FeeMaster.sol
pnpm hardhat ignition deploy ignition/modules/FeeMaster.ts --network base --verify
# BASE 上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.ts --network base --verify
# BASE 上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.ts --network base --verify

```

## server
### 启动
```
pnpm -F @crypto-transfer/server dev
```
### 构建
```
pnpm -F @crypto-transfer/server build:ts
```
### 构建Docker镜像
```
docker build -t cgyrock/crypto-transfer-server --platform linux/amd64 .
```
### 启动Docker镜像
```
docker run -v $(pwd)/packages/server/.env:/app/.env -p 3000:3000 cgyrock/crypto-transfer-server
```

## smart-wallet
### 启动
```
PORT=3001 pnpm -F @crypto-transfer/smart-wallets dev
```
### 构建
```
pnpm -F @crypto-transfer/smart-wallets build
```