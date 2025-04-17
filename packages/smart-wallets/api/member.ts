import { API } from "./api";
import apiClient from "./base";

export const memberApi = {
  // 更新会员信息
  updateMember: (data: {
    nickname?: string;
    avatar?: string;
  }): Promise<API.Response<void>> =>
    apiClient.post("/member/user/update-member", data),

  // 获取当前用户
  getCurrentUser: (): Promise<API.Response<API.Member>> =>
    apiClient.get("/member/user/find-user"),

  // 分页查询会员列表
  pageMember: (
    params: API.MemberPageQuery
  ): Promise<API.Response<API.PagedMemberResult>> =>
    apiClient.get("/member/user/page-member", { params }),

  findSmartWalletAddress: (
    params: API.FindMemberSmartWalletInput
  ): Promise<API.Response<string>> =>
    apiClient.get("/member/user/find-smart-wallet-address", { params }),

  updateMemberSmartWallet: (
    data: API.UpdateMemberSmartWalletInput
  ): Promise<API.Response<void>> =>
    apiClient.post("/member/user/update-member-smart-wallet", data),
};
