-- CreateTable
CREATE TABLE `sys_user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `name` VARCHAR(32) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `mail` VARCHAR(255) NULL,
    `remark` VARCHAR(255) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `sys_user_username_key`(`username`),
    UNIQUE INDEX `sys_user_phone_key`(`phone`),
    UNIQUE INDEX `sys_user_mail_key`(`mail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `did` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `nickname` VARCHAR(32) NULL,
    `avatar` VARCHAR(255) NULL,

    UNIQUE INDEX `member_did_key`(`did`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemberRecent` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `memberId` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `relateMemberId` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `action` ENUM('SEND', 'RECEIVE') NOT NULL,
    `recent` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_linked_account` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `memberId` INTEGER UNSIGNED NOT NULL,
    `did` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `detail` TEXT NOT NULL,
    `search` VARCHAR(255) NOT NULL,

    INDEX `member_linked_account_memberId_idx`(`memberId`),
    INDEX `member_linked_account_search_idx`(`search`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `block_chain` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `network` ENUM('MAIN', 'TEST', 'DEV') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `show` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL,
    `alchemyRpc` VARCHAR(255) NULL,
    `alchemyNetwork` VARCHAR(255) NULL,
    `tokenSymbol` VARCHAR(191) NOT NULL,
    `tokenPrice` VARCHAR(191) NULL,

    UNIQUE INDEX `block_chain_platform_chainId_key`(`platform`, `chainId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_contract` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `address` VARCHAR(191) NOT NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `network` ENUM('MAIN', 'TEST', 'DEV') NOT NULL,
    `erc` ENUM('ERC20') NOT NULL,
    `tokenName` VARCHAR(191) NULL,
    `tokenSymbol` VARCHAR(191) NULL,
    `tokenDecimals` INTEGER UNSIGNED NULL,
    `logo` VARCHAR(255) NULL,
    `show` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL,
    `priceCurrency` VARCHAR(8) NULL DEFAULT 'USD',
    `priceValue` VARCHAR(191) NULL,
    `priceUpdateAt` DATETIME(3) NULL,
    `priceAutoUpdate` TINYINT UNSIGNED NOT NULL DEFAULT false,

    UNIQUE INDEX `token_contract_platform_chainId_address_key`(`platform`, `chainId`, `address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `biz_contract` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `address` VARCHAR(191) NOT NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `network` ENUM('MAIN', 'TEST', 'DEV') NOT NULL,
    `business` ENUM('LINK', 'VAULT', 'TRANSFER') NOT NULL,
    `enabled` BOOLEAN NOT NULL,
    `ver` INTEGER NOT NULL,

    UNIQUE INDEX `biz_contract_platform_chainId_business_key`(`platform`, `chainId`, `business`),
    UNIQUE INDEX `biz_contract_platform_chainId_address_key`(`platform`, `chainId`, `address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_history` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `memberId` INTEGER UNSIGNED NOT NULL,
    `transactionCode` VARCHAR(64) NOT NULL,
    `transactionCategory` ENUM('SEND', 'REQUEST', 'DEPOSIT', 'WITHDRAW') NOT NULL,
    `transactionType` ENUM('SEND', 'REQUEST', 'DEPOSIT', 'WITHDRAW', 'PAY_LINK', 'QR_CODE', 'REQUEST_LINK', 'REQUEST_QR_CODE') NOT NULL,
    `business` ENUM('LINK', 'VAULT', 'TRANSFER') NULL,
    `bizContractAddress` VARCHAR(255) NULL,
    `senderMemberId` INTEGER UNSIGNED NULL,
    `senderDid` VARCHAR(191) NULL,
    `senderWalletAddress` VARCHAR(255) NULL,
    `receiverMemberId` INTEGER UNSIGNED NULL,
    `receiverDid` VARCHAR(191) NULL,
    `receiverWalletAddress` VARCHAR(255) NULL,
    `transactionStatus` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL,
    `transactionTime` DATETIME(3) NOT NULL,
    `transactionConfirmAt` DATETIME(3) NULL,
    `transactionHash` VARCHAR(255) NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `network` ENUM('MAIN', 'TEST', 'DEV') NOT NULL,
    `tokenSymbol` VARCHAR(191) NULL,
    `tokenDecimals` INTEGER UNSIGNED NULL,
    `tokenContractAddress` VARCHAR(255) NOT NULL,
    `tokenPrice` VARCHAR(191) NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `networkFee` INTEGER UNSIGNED NOT NULL,
    `message` VARCHAR(255) NULL,

    UNIQUE INDEX `transaction_history_transactionCode_key`(`transactionCode`),
    UNIQUE INDEX `transaction_history_platform_chainId_transactionHash_key`(`platform`, `chainId`, `transactionHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayLink` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `transactionHistoryId` INTEGER UNSIGNED NOT NULL,
    `transactionCode` VARCHAR(64) NOT NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `network` ENUM('MAIN', 'TEST', 'DEV') NOT NULL,
    `tokenContractAddress` VARCHAR(255) NOT NULL,
    `senderWalletAddress` VARCHAR(255) NOT NULL,
    `bizContractAddress` VARCHAR(255) NOT NULL,
    `otp` VARCHAR(255) NOT NULL,
    `transactionHash` VARCHAR(255) NULL,

    UNIQUE INDEX `PayLink_transactionHistoryId_key`(`transactionHistoryId`),
    UNIQUE INDEX `PayLink_transactionCode_key`(`transactionCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `memberId` INTEGER UNSIGNED NOT NULL,
    `notifyTransUpdate` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifyAbnormalAlarm` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifyPayRequest` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifyCardActivity` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifyCustomerSupport` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifyBalanceAlarm` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifySecureAlarm` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `notifySummary` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `sysAppUpdate` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `sysSalesPromotion` TINYINT UNSIGNED NOT NULL DEFAULT true,
    `sysSurvey` TINYINT UNSIGNED NOT NULL DEFAULT true,

    UNIQUE INDEX `Setting_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `source` VARCHAR(64) NOT NULL,
    `subject` VARCHAR(64) NOT NULL,
    `action` VARCHAR(64) NULL,
    `title` VARCHAR(255) NULL,
    `context` TEXT NULL,
    `toMemberId` INTEGER UNSIGNED NOT NULL,
    `toMemberRole` ENUM('NONE', 'SENDER', 'RECEIVER') NOT NULL,
    `status` TINYINT NOT NULL DEFAULT 0,
    `notifyAt` DATETIME(3) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `transactionHistoryId` INTEGER UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_fee_estimate` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `deleted` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `updateBy` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleteAt` DATETIME(3) NULL,
    `transactionHistoryId` INTEGER UNSIGNED NOT NULL,
    `transactionCode` VARCHAR(64) NOT NULL,
    `platform` ENUM('ETH', 'SOLANA') NOT NULL,
    `chainId` INTEGER NOT NULL,
    `ethToUsd` VARCHAR(191) NOT NULL,
    `tokenSymbol` VARCHAR(191) NOT NULL,
    `tokenDecimals` INTEGER UNSIGNED NOT NULL,
    `tokenContractAddress` VARCHAR(255) NOT NULL,
    `tokenPrice` VARCHAR(191) NOT NULL,
    `preVerificationGas` VARCHAR(255) NOT NULL,
    `verificationGasLimit` VARCHAR(255) NOT NULL,
    `callGasLimit` VARCHAR(255) NOT NULL,
    `gas` VARCHAR(255) NOT NULL,
    `gasPrice` VARCHAR(255) NOT NULL,
    `totalWeiCost` VARCHAR(255) NOT NULL,
    `totalEthCost` VARCHAR(255) NOT NULL,
    `totalUsdCost` VARCHAR(255) NOT NULL,
    `totalTokenCost` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

