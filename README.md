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
# BASE SEPOLIA上部署并验证TokenTransfer.sol
pnpm hardhat ignition deploy ignition/modules/TokenTransfer.sol.ts --network baseSepolia --verify
# BASE SEPOLIA上部署并验证TokenLink.sol
pnpm hardhat ignition deploy ignition/modules/TokenLink.sol.ts --network baseSepolia --verify
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