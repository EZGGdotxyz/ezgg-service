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
};
