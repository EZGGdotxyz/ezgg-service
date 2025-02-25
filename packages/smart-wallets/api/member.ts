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
};
