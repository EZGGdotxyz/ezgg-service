export declare namespace API {
  export interface Response<T> {
    code: number;
    data: T;
    message?: string;
  }

  // 从服务端Schemas生成类型
  export type Member = {
    id: number;
    did: string;
    nickname?: string;
    avatar?: string;
    createdAt: Date;
    memberLinkedAccount?: LinkedAccount[]; // 新增关联账号字段
  };

  // 新增分页查询相关类型
  export type MemberPageQuery = {
    search?: string;
    page?: number;
    pageSize?: number;
  };

  export type LinkedAccount = {
    type: string;
    search: string;
    detail: string;
  };

  // 补充分页结果类型（如果尚未存在）
  export type PagedMemberResult = PagedResult<Member>;

  export type TransactionHistory = {
    id: number;
    transactionCode: string;
    bizContractAddress: string;
    platform: BlockChainPlatform;
    chainId: number;
    tokenSymbol: string;
    amount: number;
    transactionStatus: TransactionStatus;
    transactionHash?: string;
    transactionTime?: Date;
    network?: BlockChainNetwork;
    tokenDecimals?: number;
    tokenContractAddress?: string;
    senderMemberId?: number;
    senderDid?: string;
    senderWalletAddress?: string;
    receiverMemberId?: number;
    receiverDid?: string;
    receiverWalletAddress?: string;
    message?: string;
  };

  export type TransactionHistoryCreateInput = {
    platform: BlockChainPlatform;
    chainId: number;
    tokenSymbol: string;
    transactionCategory: TransactionCategory;
    transactionType: TransactionType;
    receiverMemberId?: number;
    amount: number;
    message?: string;
  };

  export type TransactionHistoryQuery = {
    platform?: BlockChainPlatform;
    chainId?: number;
    tokenSymbol?: string;
    network?: BlockChainNetwork;
    transactionCategory?: TransactionCategory;
    transactionType?: TransactionType;
    receiverMemberId?: number;
    transactionHash?: string;
    transactionTimeFrom?: Date;
    transactionTimeTo?: Date;
    page?: number;
    pageSize?: number;
  };

  export type PagedResult<T> = {
    record: T[];
    total: number;
    page: number;
    pageSize: number;
  };

  // PayLink 相关类型
  export type PlayLinkCreateInput = {
    transactionCode: string;
  };

  export type PlayLinkTransactionHashUpdateInput = {
    transactionCode: string;
    transactionHash: string;
  };

  export type FindPayLinkInput = {
    transactionCode: string;
  };

  export type PlayLinkOutput = {
    transactionCode: string;
    platform: BlockChainPlatform;
    chainId: number;
    tokenSymbol: string;
    tokenContractAddress: string;
    senderWalletAddress: string;
    bizContractAddress: string;
    otp: string;
  };

  export type BlockChain = {
    id: number;
    platform: BlockChainPlatform;
    chainId: number;
    network: BlockChainNetwork;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    sort: number;
    show: boolean;
  };

  export type TokenContract = {
    id: number;
    platform: BlockChainPlatform;
    chainId: number;
    network: BlockChainNetwork;
    tokenSymbol: string;
    tokenName: string;
    contractAddress: string;
    decimals: number;
    sort: number;
    show: boolean;
  };

  export type BizContract = {
    id: number;
    platform: BlockChainPlatform;
    chainId: number;
    network: BlockChainNetwork;
    business: BIZ;
    contractAddress: string;
    ver: string;
    enabled: boolean;
  };

  // 继承服务端查询参数类型
  export type BlockChainQuery = {
    platform: BlockChainPlatform;
    network?: BlockChainNetwork;
    show?: boolean;
  };

  export type TokenContractQuery = {
    platform: BlockChainPlatform;
    chainId?: number;
    network?: BlockChainNetwork;
    show?: boolean;
  };

  export type BizContractQuery = {
    platform: BlockChainPlatform;
    chainId?: number;
    network?: BlockChainNetwork;
    enabled?: boolean;
  };
}

// 补充枚举类型（如果尚未定义）
export enum LinkedAccountType {
  WALLET = "wallet",
  EMAIL = "email",
  GOOGLE = "google_oauth",
  // 其他账号类型...
}

export enum BlockChainPlatform {
  ETH = "ETH",
  SOLANA = "SOLANA",
}

export enum BlockChainNetwork {
  MAIN = "MAIN",
  TEST = "TEST",
  DEV = "DEV",
}

export enum TransactionCategory {
  SEND = "SEND",
  REQUEST = "REQUEST",
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
}

export enum TransactionType {
  SEND = "SEND",
  REQUEST = "REQUEST",
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  PAY_LINK = "PAY_LINK",
  QR_CODE = "QR_CODE",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export enum BIZ {
  LINK = "LINK",
  VAULT = "VAULT",
  TRANSFER = "TRANSFER",
}
