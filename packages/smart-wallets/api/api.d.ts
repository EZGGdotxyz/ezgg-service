declare namespace API {
  interface Response<T> {
    code: number;
    data: T;
    message?: string;
  }

  // 从服务端Schemas生成类型
  type Member = {
    id: number;
    did: string;
    nickname?: string;
    avatar?: string;
  };

  type TransactionHistory = {
    id: number;
    platform: string;
    chainId: number;
    tokenSymbol: string;
    amount: number;
    transactionStatus: string;
  };

  // 其他接口类型...
}
