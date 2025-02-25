import { API } from "./api";
import apiClient from "./base";

export const transactionApi = {
  // 创建交易记录
  createTransactionHistory: (
    data: API.TransactionHistoryCreateInput
  ): Promise<API.Response<API.TransactionHistory>> =>
    apiClient.post(
      "/member/transaction/history/create-transaction-history",
      data
    ),

  // 更新交易哈希
  updateTransactionHash: (data: {
    id: number;
    transactionHash: string;
  }): Promise<API.Response<API.TransactionHistory>> =>
    apiClient.post("/member/transaction/history/update-transaction-hash", data),

  // 拒绝支付请求
  declineTransactionHistory: (
    id: number
  ): Promise<API.Response<API.TransactionHistory>> =>
    apiClient.post("/member/transaction/history/decline-transaction-history", {
      id,
    }),

  // 获取交易详情
  getTransactionHistory: (
    id: number
  ): Promise<API.Response<API.TransactionHistory>> =>
    apiClient.get(`/member/transaction/history/find-transaction-history/${id}`),

  // 分页查询交易记录
  pageTransactionHistory: (
    params: API.TransactionHistoryQuery
  ): Promise<API.Response<API.PagedResult<API.TransactionHistory>>> =>
    apiClient.get("/member/transaction/history/page-transaction-history", {
      params,
    }),
};
