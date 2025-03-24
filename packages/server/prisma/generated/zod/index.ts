import { z } from "zod";

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum([
  "ReadUncommitted",
  "ReadCommitted",
  "RepeatableRead",
  "Serializable",
]);

export const SysUserScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "name",
  "username",
  "password",
  "phone",
  "mail",
  "remark",
  "enabled",
]);

export const MemberScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "did",
  "createdAt",
  "nickname",
  "avatar",
]);

export const MemberRecentScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "memberId",
  "relateMemberId",
  "action",
  "recent",
]);

export const MemberLinkedAccountScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "memberId",
  "did",
  "type",
  "detail",
  "search",
]);

export const BlockChainScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "platform",
  "chainId",
  "network",
  "name",
  "show",
  "sort",
  "alchemyRpc",
  "alchemyNetwork",
  "tokenSymbol",
  "tokenPrice",
]);

export const TokenContractScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "address",
  "platform",
  "chainId",
  "network",
  "erc",
  "tokenName",
  "tokenSymbol",
  "tokenDecimals",
  "logo",
  "show",
  "sort",
  "priceCurrency",
  "priceValue",
  "priceUpdateAt",
  "priceAutoUpdate",
  "feeSupport",
]);

export const BizContractScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "address",
  "platform",
  "chainId",
  "network",
  "business",
  "enabled",
  "ver",
]);

export const TransactionHistoryScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "memberId",
  "transactionCode",
  "transactionCategory",
  "transactionType",
  "business",
  "bizContractAddress",
  "senderMemberId",
  "senderDid",
  "senderWalletAddress",
  "receiverMemberId",
  "receiverDid",
  "receiverWalletAddress",
  "transactionStatus",
  "transactionTime",
  "transactionConfirmAt",
  "transactionHash",
  "platform",
  "chainId",
  "network",
  "tokenSymbol",
  "tokenDecimals",
  "tokenContractAddress",
  "tokenPrice",
  "tokenFeeSupport",
  "amount",
  "message",
]);

export const PayLinkScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "transactionHistoryId",
  "transactionCode",
  "platform",
  "chainId",
  "network",
  "tokenContractAddress",
  "senderWalletAddress",
  "bizContractAddress",
  "otp",
  "transactionHash",
]);

export const SettingScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "memberId",
  "notifyTransUpdate",
  "notifyAbnormalAlarm",
  "notifyPayRequest",
  "notifyCardActivity",
  "notifyCustomerSupport",
  "notifyBalanceAlarm",
  "notifySecureAlarm",
  "notifySummary",
  "sysAppUpdate",
  "sysSalesPromotion",
  "sysSurvey",
]);

export const NotificationScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "source",
  "subject",
  "action",
  "title",
  "context",
  "toMemberId",
  "toMemberRole",
  "status",
  "notifyAt",
  "readAt",
  "transactionHistoryId",
]);

export const TransactionFeeEstimateScalarFieldEnumSchema = z.enum([
  "id",
  "deleted",
  "createBy",
  "updateBy",
  "createAt",
  "updateAt",
  "deleteAt",
  "transactionHistoryId",
  "transactionCode",
  "platform",
  "chainId",
  "ethToUsd",
  "tokenSymbol",
  "tokenDecimals",
  "tokenContractAddress",
  "tokenPrice",
  "preVerificationGas",
  "verificationGasLimit",
  "callGasLimit",
  "gas",
  "gasPrice",
  "totalWeiCost",
  "totalEthCost",
  "totalUsdCost",
  "platformFee",
  "totalTokenCost",
]);

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const NullsOrderSchema = z.enum(["first", "last"]);

export const SysUserOrderByRelevanceFieldEnumSchema = z.enum([
  "name",
  "username",
  "password",
  "phone",
  "mail",
  "remark",
]);

export const MemberOrderByRelevanceFieldEnumSchema = z.enum([
  "did",
  "nickname",
  "avatar",
]);

export const MemberLinkedAccountOrderByRelevanceFieldEnumSchema = z.enum([
  "did",
  "type",
  "detail",
  "search",
]);

export const BlockChainOrderByRelevanceFieldEnumSchema = z.enum([
  "name",
  "alchemyRpc",
  "alchemyNetwork",
  "tokenSymbol",
  "tokenPrice",
]);

export const TokenContractOrderByRelevanceFieldEnumSchema = z.enum([
  "address",
  "tokenName",
  "tokenSymbol",
  "logo",
  "priceCurrency",
  "priceValue",
]);

export const BizContractOrderByRelevanceFieldEnumSchema = z.enum(["address"]);

export const TransactionHistoryOrderByRelevanceFieldEnumSchema = z.enum([
  "transactionCode",
  "bizContractAddress",
  "senderDid",
  "senderWalletAddress",
  "receiverDid",
  "receiverWalletAddress",
  "transactionHash",
  "tokenSymbol",
  "tokenContractAddress",
  "tokenPrice",
  "message",
]);

export const PayLinkOrderByRelevanceFieldEnumSchema = z.enum([
  "transactionCode",
  "tokenContractAddress",
  "senderWalletAddress",
  "bizContractAddress",
  "otp",
  "transactionHash",
]);

export const NotificationOrderByRelevanceFieldEnumSchema = z.enum([
  "source",
  "subject",
  "action",
  "title",
  "context",
]);

export const TransactionFeeEstimateOrderByRelevanceFieldEnumSchema = z.enum([
  "transactionCode",
  "ethToUsd",
  "tokenSymbol",
  "tokenContractAddress",
  "tokenPrice",
  "preVerificationGas",
  "verificationGasLimit",
  "callGasLimit",
  "gas",
  "gasPrice",
  "totalWeiCost",
  "totalEthCost",
  "totalUsdCost",
  "platformFee",
  "totalTokenCost",
]);

export const MemberRecentActionSchema = z.enum(["SEND", "RECEIVE"]);

export type MemberRecentActionType = `${z.infer<
  typeof MemberRecentActionSchema
>}`;

export const BlockChainPlatformSchema = z.enum(["ETH", "SOLANA"]);

export type BlockChainPlatformType = `${z.infer<
  typeof BlockChainPlatformSchema
>}`;

export const BlockChainNetworkSchema = z.enum(["MAIN", "TEST", "DEV"]);

export type BlockChainNetworkType = `${z.infer<
  typeof BlockChainNetworkSchema
>}`;

export const ERCSchema = z.enum(["ERC20"]);

export type ERCType = `${z.infer<typeof ERCSchema>}`;

export const BIZSchema = z.enum(["LINK", "VAULT", "TRANSFER"]);

export type BIZType = `${z.infer<typeof BIZSchema>}`;

export const TransactionStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
]);

export type TransactionStatusType = `${z.infer<
  typeof TransactionStatusSchema
>}`;

export const TransactionCategorySchema = z.enum([
  "SEND",
  "REQUEST",
  "DEPOSIT",
  "WITHDRAW",
]);

export type TransactionCategoryType = `${z.infer<
  typeof TransactionCategorySchema
>}`;

export const TransactionTypeSchema = z.enum([
  "SEND",
  "REQUEST",
  "DEPOSIT",
  "WITHDRAW",
  "PAY_LINK",
  "QR_CODE",
  "REQUEST_LINK",
  "REQUEST_QR_CODE",
]);

export type TransactionTypeType = `${z.infer<typeof TransactionTypeSchema>}`;

export const ToMemberRoleSchema = z.enum(["NONE", "SENDER", "RECEIVER"]);

export type ToMemberRoleType = `${z.infer<typeof ToMemberRoleSchema>}`;

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// SYS USER SCHEMA
/////////////////////////////////////////

export const SysUserSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 管理员
   */
  name: z.string().describe("管理员"),
  /**
   * 用户账户
   */
  username: z.string().describe("用户账户"),
  /**
   * 密码
   */
  password: z.string().describe("密码"),
  /**
   * 手机号码
   */
  phone: z.string().nullable().describe("手机号码"),
  /**
   * 电子邮箱
   */
  mail: z.string().nullable().describe("电子邮箱"),
  /**
   * 备注信息
   */
  remark: z.string().nullable().describe("备注信息"),
  /**
   * 停用/启用标识；false 停用；true 启用
   */
  enabled: z.boolean().describe("停用/启用标识；false 停用；true 启用"),
});

export type SysUser = z.infer<typeof SysUserSchema>;

/////////////////////////////////////////
// MEMBER SCHEMA
/////////////////////////////////////////

export const MemberSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * Privy User DID
   */
  did: z.string().describe("Privy User DID"),
  /**
   * Privy User 创建时间
   */
  createdAt: z.coerce.date().describe("Privy User 创建时间"),
  /**
   * 昵称
   */
  nickname: z.string().nullable().describe("昵称"),
  /**
   * 头像地址
   */
  avatar: z.string().nullable().describe("头像地址"),
});

export type Member = z.infer<typeof MemberSchema>;

/////////////////////////////////////////
// MEMBER RECENT SCHEMA
/////////////////////////////////////////

export const MemberRecentSchema = z.object({
  /**
   * 最近操作类型
   */
  action: MemberRecentActionSchema.describe("最近操作类型"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 所属会员id
   */
  memberId: z.number().int().describe("所属会员id"),
  /**
   * 关联会员id
   */
  relateMemberId: z.number().int().describe("关联会员id"),
  /**
   * 最近联系时间
   */
  recent: z.coerce.date().describe("最近联系时间"),
});

export type MemberRecent = z.infer<typeof MemberRecentSchema>;

/////////////////////////////////////////
// MEMBER LINKED ACCOUNT SCHEMA
/////////////////////////////////////////

export const MemberLinkedAccountSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 用户id
   */
  memberId: z.number().int().describe("用户id"),
  /**
   * Privy User DID
   */
  did: z.string().describe("Privy User DID"),
  /**
   * Privy User LinkedAccount的类型
   */
  type: z.string().describe("Privy User LinkedAccount的类型"),
  /**
   * Privy User 绑定账号详情JSON
   */
  detail: z.string().describe("Privy User 绑定账号详情JSON"),
  /**
   * 从detail提取的用于检索的字段
   */
  search: z.string().describe("从detail提取的用于检索的字段"),
});

export type MemberLinkedAccount = z.infer<typeof MemberLinkedAccountSchema>;

/////////////////////////////////////////
// BLOCK CHAIN SCHEMA
/////////////////////////////////////////

/**
 * 区块链信息
 */
export const BlockChainSchema = z.object({
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 区块链网络
   */
  network: BlockChainNetworkSchema.describe("区块链网络"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * 区块链名称
   */
  name: z.string().describe("区块链名称"),
  /**
   * 是否在用户端展示
   */
  show: z.boolean().describe("是否在用户端展示"),
  /**
   * 排序号
   */
  sort: z.number().int().describe("排序号"),
  /**
   * Alchemy RPC API地址
   */
  alchemyRpc: z.string().nullable().describe("Alchemy RPC API地址"),
  /**
   * Alchemy Network 枚举值
   */
  alchemyNetwork: z.string().nullable().describe("Alchemy Network 枚举值"),
  /**
   * 原生代币符号
   */
  tokenSymbol: z.string().describe("原生代币符号"),
  /**
   * 原生代币价格（美元）
   */
  tokenPrice: z.string().nullable().describe("原生代币价格（美元）"),
});

export type BlockChain = z.infer<typeof BlockChainSchema>;

/////////////////////////////////////////
// TOKEN CONTRACT SCHEMA
/////////////////////////////////////////

/**
 * 代币合约信息
 */
export const TokenContractSchema = z.object({
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 区块链网络
   */
  network: BlockChainNetworkSchema.describe("区块链网络"),
  /**
   * 代币标准
   */
  erc: ERCSchema.describe("代币标准"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 代币合约地址
   */
  address: z.string().describe("代币合约地址"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * 代币名称
   */
  tokenName: z.string().nullable().describe("代币名称"),
  /**
   * 代币符号
   */
  tokenSymbol: z.string().nullable().describe("代币符号"),
  /**
   * 代币精度
   */
  tokenDecimals: z.number().int().nullable().describe("代币精度"),
  /**
   * 代币图标
   */
  logo: z.string().nullable().describe("代币图标"),
  /**
   * 是否在用户端展示
   */
  show: z.boolean().describe("是否在用户端展示"),
  /**
   * 排序号
   */
  sort: z.number().int().describe("排序号"),
  /**
   * 代币价格 - 币种
   */
  priceCurrency: z.string().nullable().describe("代币价格 - 币种"),
  /**
   * 代币价格
   */
  priceValue: z.string().nullable().describe("代币价格"),
  /**
   * 代币价格更新时间
   */
  priceUpdateAt: z.coerce.date().nullable().describe("代币价格更新时间"),
  /**
   * 代币价格自动更新标识
   */
  priceAutoUpdate: z.boolean().describe("代币价格自动更新标识"),
  /**
   * 是否支持支付手续费
   */
  feeSupport: z.boolean().describe("是否支持支付手续费"),
});

export type TokenContract = z.infer<typeof TokenContractSchema>;

/////////////////////////////////////////
// BIZ CONTRACT SCHEMA
/////////////////////////////////////////

/**
 * 业务合约信息
 */
export const BizContractSchema = z.object({
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 区块链网络
   */
  network: BlockChainNetworkSchema.describe("区块链网络"),
  /**
   * 业务类型枚举
   */
  business: BIZSchema.describe("业务类型枚举"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 业务合约地址
   */
  address: z.string().describe("业务合约地址"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * 是否启用
   */
  enabled: z.boolean().describe("是否启用"),
  /**
   * 合约版本
   */
  ver: z.number().int().describe("合约版本"),
});

export type BizContract = z.infer<typeof BizContractSchema>;

/////////////////////////////////////////
// TRANSACTION HISTORY SCHEMA
/////////////////////////////////////////

/**
 * 交易历史记录
 */
export const TransactionHistorySchema = z.object({
  /**
   * 交易分类
   */
  transactionCategory: TransactionCategorySchema.describe("交易分类"),
  /**
   * 交易类型
   */
  transactionType: TransactionTypeSchema.describe("交易类型"),
  /**
   * 业务类型枚举
   */
  business: BIZSchema.nullable().describe("业务类型枚举"),
  /**
   * 交易状态：PENDING 待支付；ACCEPTED 已支付；DECLINED 已拒绝；
   */
  transactionStatus: TransactionStatusSchema.describe(
    "交易状态：PENDING 待支付；ACCEPTED 已支付；DECLINED 已拒绝；"
  ),
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 区块链网络
   */
  network: BlockChainNetworkSchema.describe("区块链网络"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 交易创建人 - 会员id
   */
  memberId: z.number().int().describe("交易创建人 - 会员id"),
  /**
   * 交易编码
   */
  transactionCode: z.string().describe("交易编码"),
  /**
   * 业务合约地址
   */
  bizContractAddress: z.string().nullable().describe("业务合约地址"),
  /**
   * 付款人 - 会员id
   */
  senderMemberId: z.number().int().nullable().describe("付款人 - 会员id"),
  /**
   * 付款人 - Privy 用户id
   */
  senderDid: z.string().nullable().describe("付款人 - Privy 用户id"),
  /**
   * 付款人 - 钱包地址
   */
  senderWalletAddress: z.string().nullable().describe("付款人 - 钱包地址"),
  /**
   * 收款人 - 会员id
   */
  receiverMemberId: z.number().int().nullable().describe("收款人 - 会员id"),
  /**
   * 收款人 - Privy 用户id
   */
  receiverDid: z.string().nullable().describe("收款人 - Privy 用户id"),
  /**
   * 收款人 - 钱包地址
   */
  receiverWalletAddress: z.string().nullable().describe("收款人 - 钱包地址"),
  /**
   * 交易发起时间
   */
  transactionTime: z.coerce.date().describe("交易发起时间"),
  /**
   * 交易确认时间
   */
  transactionConfirmAt: z.coerce.date().nullable().describe("交易确认时间"),
  /**
   * 交易哈希
   */
  transactionHash: z.string().nullable().describe("交易哈希"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * 代币符号
   */
  tokenSymbol: z.string().nullable().describe("代币符号"),
  /**
   * 代币精度
   */
  tokenDecimals: z.number().int().nullable().describe("代币精度"),
  /**
   * 代币合约地址
   */
  tokenContractAddress: z.string().describe("代币合约地址"),
  /**
   * 代币兑美元价格
   */
  tokenPrice: z.string().nullable().describe("代币兑美元价格"),
  /**
   * 代币是否支持支付网络费用
   */
  tokenFeeSupport: z.boolean().describe("代币是否支持支付网络费用"),
  /**
   * 交易金额（代币数量）
   */
  amount: z.bigint().describe("交易金额（代币数量）"),
  /**
   * 附带留言
   */
  message: z.string().nullable().describe("附带留言"),
});

export type TransactionHistory = z.infer<typeof TransactionHistorySchema>;

/////////////////////////////////////////
// PAY LINK SCHEMA
/////////////////////////////////////////

export const PayLinkSchema = z.object({
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 区块链网络
   */
  network: BlockChainNetworkSchema.describe("区块链网络"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  transactionHistoryId: z.number().int(),
  /**
   * 交易编码
   */
  transactionCode: z.string().describe("交易编码"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * 代币合约地址
   */
  tokenContractAddress: z.string().describe("代币合约地址"),
  /**
   * 付款人 - 钱包地址
   */
  senderWalletAddress: z.string().describe("付款人 - 钱包地址"),
  /**
   * 业务合约地址
   */
  bizContractAddress: z.string().describe("业务合约地址"),
  /**
   * OTP
   */
  otp: z.string().describe("OTP"),
  /**
   * 交易哈希
   */
  transactionHash: z.string().nullable().describe("交易哈希"),
});

export type PayLink = z.infer<typeof PayLinkSchema>;

/////////////////////////////////////////
// SETTING SCHEMA
/////////////////////////////////////////

export const SettingSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 会员id
   */
  memberId: z.number().int().describe("会员id"),
  /**
   * 交易状态更新
   */
  notifyTransUpdate: z.boolean().describe("交易状态更新"),
  /**
   * 欺诈或可疑活动报警
   */
  notifyAbnormalAlarm: z.boolean().describe("欺诈或可疑活动报警"),
  /**
   * 付款请求通知
   */
  notifyPayRequest: z.boolean().describe("付款请求通知"),
  /**
   * Card Activity Notification
   */
  notifyCardActivity: z.boolean().describe("Card Activity Notification"),
  /**
   * 客户支持通知
   */
  notifyCustomerSupport: z.boolean().describe("客户支持通知"),
  /**
   * 账户余额警报
   */
  notifyBalanceAlarm: z.boolean().describe("账户余额警报"),
  /**
   * 安全警报
   */
  notifySecureAlarm: z.boolean().describe("安全警报"),
  /**
   * 每日或每周摘要
   */
  notifySummary: z.boolean().describe("每日或每周摘要"),
  /**
   * 应用程序更新与增强
   */
  sysAppUpdate: z.boolean().describe("应用程序更新与增强"),
  /**
   * 促销优惠与更新
   */
  sysSalesPromotion: z.boolean().describe("促销优惠与更新"),
  /**
   * 参与调研
   */
  sysSurvey: z.boolean().describe("参与调研"),
});

export type Setting = z.infer<typeof SettingSchema>;

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

/**
 * 站内信
 */
export const NotificationSchema = z.object({
  /**
   * 接收人交易角色角色：NONE 未指定；SENDER 付款人；RECEIVER 收款人
   */
  toMemberRole: ToMemberRoleSchema.describe(
    "接收人交易角色角色：NONE 未指定；SENDER 付款人；RECEIVER 收款人"
  ),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  /**
   * 通知来源枚举：SYSTEM 系统自动触发；ADMIN 管理后台发送；
   */
  source: z
    .string()
    .describe("通知来源枚举：SYSTEM 系统自动触发；ADMIN 管理后台发送；"),
  /**
   * 通知主题枚举：GENERAL 普通通知；TRANS_UPDATE 交易状态更新；ALARM 欺诈或可疑活动报警；PAY_REQUEST 付款请求通知；CUSTOMER_SUPPORT 客户支持通知；BALANCE_ALARM 账户余额警报；SECURE_ALARM 安全警报；SUMMARY 每日或每周摘要；APP_UPDATE 应用程序更新与增强；SALES_PROMOTION 促销优惠与更新；SURVEY 参与调研；
   */
  subject: z
    .string()
    .describe(
      "通知主题枚举：GENERAL 普通通知；TRANS_UPDATE 交易状态更新；ALARM 欺诈或可疑活动报警；PAY_REQUEST 付款请求通知；CUSTOMER_SUPPORT 客户支持通知；BALANCE_ALARM 账户余额警报；SECURE_ALARM 安全警报；SUMMARY 每日或每周摘要；APP_UPDATE 应用程序更新与增强；SALES_PROMOTION 促销优惠与更新；SURVEY 参与调研；"
    ),
  /**
   * 交易状态更新动作枚举：REQUEST_ACCEPTED 请求已接受；REQUEST_DECLINED 请求已拒绝；PAY_LINK_ACCEPTED PayLink已接受；
   */
  action: z
    .string()
    .nullable()
    .describe(
      "交易状态更新动作枚举：REQUEST_ACCEPTED 请求已接受；REQUEST_DECLINED 请求已拒绝；PAY_LINK_ACCEPTED PayLink已接受；"
    ),
  /**
   * 标题
   */
  title: z.string().nullable().describe("标题"),
  /**
   * 正文
   */
  context: z.string().nullable().describe("正文"),
  /**
   * 接收人会员id
   */
  toMemberId: z.number().int().describe("接收人会员id"),
  /**
   * 状态值：0 未读；1已读
   */
  status: z.number().int().describe("状态值：0 未读；1已读"),
  /**
   * 通知时间
   */
  notifyAt: z.coerce.date().describe("通知时间"),
  /**
   * 读取时间
   */
  readAt: z.coerce.date().nullable().describe("读取时间"),
  /**
   * 关联交易历史id
   */
  transactionHistoryId: z.number().int().nullable().describe("关联交易历史id"),
});

export type Notification = z.infer<typeof NotificationSchema>;

/////////////////////////////////////////
// TRANSACTION FEE ESTIMATE SCHEMA
/////////////////////////////////////////

export const TransactionFeeEstimateSchema = z.object({
  /**
   * 区块链平台
   */
  platform: BlockChainPlatformSchema.describe("区块链平台"),
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  // omitted: deleteAt: z.coerce.date().nullable().describe("删除时间"),
  transactionHistoryId: z.number().int(),
  /**
   * 交易编码
   */
  transactionCode: z.string().describe("交易编码"),
  /**
   * 区块链id
   */
  chainId: z.number().int().describe("区块链id"),
  /**
   * ETH兑美元价值
   */
  ethToUsd: z.string().describe("ETH兑美元价值"),
  /**
   * 代币符号
   */
  tokenSymbol: z.string().describe("代币符号"),
  /**
   * 代币精度
   */
  tokenDecimals: z.number().int().describe("代币精度"),
  /**
   * 代币合约地址
   */
  tokenContractAddress: z.string().describe("代币合约地址"),
  /**
   * 代币兑美元价格
   */
  tokenPrice: z.string().describe("代币兑美元价格"),
  /**
   * UserOperation打包前，序列化，基础校验消耗的gas
   */
  preVerificationGas: z
    .string()
    .describe("UserOperation打包前，序列化，基础校验消耗的gas"),
  /**
   * UserOperation打包，验证合法性，校验签名消耗的gas
   */
  verificationGasLimit: z
    .string()
    .describe("UserOperation打包，验证合法性，校验签名消耗的gas"),
  /**
   * UserOperation执行用户操作消耗的gas
   */
  callGasLimit: z.string().describe("UserOperation执行用户操作消耗的gas"),
  /**
   * 合计消耗的gas
   */
  gas: z.string().describe("合计消耗的gas"),
  /**
   * gas价格(单位wei)
   */
  gasPrice: z.string().describe("gas价格(单位wei)"),
  /**
   * 总费用(单位wei)
   */
  totalWeiCost: z.string().describe("总费用(单位wei)"),
  /**
   * 总费用(单位eth)
   */
  totalEthCost: z.string().describe("总费用(单位eth)"),
  /**
   * 总费用(单位usd)
   */
  totalUsdCost: z.string().describe("总费用(单位usd)"),
  /**
   * 平台费用(单位usd)
   */
  platformFee: z.string().describe("平台费用(单位usd)"),
  /**
   * 最终费用(单位token)
   */
  totalTokenCost: z.string().describe("最终费用(单位token)"),
});

export type TransactionFeeEstimate = z.infer<
  typeof TransactionFeeEstimateSchema
>;
