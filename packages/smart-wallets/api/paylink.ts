import { API } from "./api";
import apiClient from "./base";

export const paylinkApi = {
  /**
   * 创建支付链接
   * @param data 请求参数
   */
  createPayLink: (
    data: API.PlayLinkCreateInput
  ): Promise<API.Response<API.PlayLinkOutput>> =>
    apiClient.post("/member/transaction/pay-link/create-pay-link", data),

  /**
   * 更新交易哈希
   * @param data 请求参数
   */
  updatePayLinkTransactionHash: (
    data: Omit<API.PlayLinkTransactionHashUpdateInput, "memberId">
  ): Promise<API.Response<void>> =>
    apiClient.post(
      "/member/transaction/pay-link/update-transaction-hash",
      data
    ),

  /**
   * 查询支付链接
   * @param data 请求参数
   */
  findPayLink: (
    data: API.FindPayLinkInput
  ): Promise<API.Response<API.PlayLinkOutput>> =>
    apiClient.post("/member/transaction/pay-link/find-pay-link", data),
};
