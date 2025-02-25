import { API } from "./api";
import apiClient from "./base";

export const infrastructureApi = {
  // 区块链列表
  listBlockChain: (
    params: API.BlockChainQuery
  ): Promise<API.Response<API.BlockChain[]>> =>
    apiClient.get("/member/infrastructure/list-blockchain", { params }),

  // 代币合约列表
  listTokenContract: (
    params: API.TokenContractQuery
  ): Promise<API.Response<API.TokenContract[]>> =>
    apiClient.get("/member/infrastructure/list-token-contract", { params }),

  // 业务合约列表
  listBusinessContract: (
    params: API.BizContractQuery
  ): Promise<API.Response<API.BizContract[]>> =>
    apiClient.get("/member/infrastructure/list-business-contract", { params })
};