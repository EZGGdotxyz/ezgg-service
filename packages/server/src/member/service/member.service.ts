import { inject, injectable } from "inversify";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { Symbols } from "../../identifier.js";
import {
  LinkedAccountWithMetadata,
  PrivyClient,
  Wallet,
  // SmartWallet,
  Email,
  Phone,
  Google,
  Twitter,
  Discord,
  Github,
  Apple,
  LinkedIn,
  Tiktok,
  Spotify,
  Instagram,
  Farcaster,
  Telegram,
  CustomJwt,
  // PasskeyAccount,
  User,
} from "@privy-io/server-auth";
import { z } from "zod";
import {
  BlockChainPlatform,
  BlockChainSmartWalletType,
  Member,
  MemberRecentAction,
  Prisma,
  TransactionHistory,
} from "@prisma/client";
import { DATA_NOT_EXIST, UNEXPECTED } from "../../core/error.js";
import { PagedResult, PageUtils } from "../../core/model.js";
import {
  MemberLinkedAccountSchema,
  MemberSchema,
} from "../../../prisma/generated/zod/index.js";
import * as _ from "radash";
import { CodeUtil } from "../../core/utils.js";
@injectable()
export class MemberService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(Symbols.PrivyClient)
    private readonly privy: PrivyClient
  ) {}

  async updateMember({
    user,
    nickname,
    avatar,
  }: UpdateMemberInput): Promise<void> {
    const { isNew, member } = await this.findOrCreateMember({ user });
    if (isNew) {
      await this.syncLinkedAccounts({ user });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.member.update({
        data: {
          nickname: isNew
            ? nickname ?? `Crypto-${CodeUtil.generateSortCode(8)}`
            : nickname,
          avatar,
        },
        where: { id: member.id },
      });
      const data = {
        ...user.customMetadata,
        id: isNew ? member.id : Number(user.customMetadata.id),
        nickname,
        avatar,
      };
      console.log(data);
      await this.privy.setCustomMetadata<CustomerMeteData>(member.did, data);
    });
  }

  async syncLinkedAccounts({ user }: { user: User }): Promise<void> {
    const userById = await this.privy.getUserById(user.id);

    const member = await this.prisma.member.findUnique({
      where: {
        did: user.id,
      },
    });
    if (!member) {
      throw DATA_NOT_EXIST({ message: "member not existed" });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.memberLinkedAccount.deleteMany({
        where: {
          did: user.id,
        },
      });
      const data: Prisma.MemberLinkedAccountCreateManyInput[] = [];
      for (const linkedAccount of userById.linkedAccounts) {
        data.push({
          memberId: member.id,
          did: user.id,
          type: linkedAccount.type,
          detail: JSON.stringify(linkedAccount),
          search: this.searchOf(linkedAccount),
        });
      }
      await tx.memberLinkedAccount.createMany({
        data,
      });
    });
  }

  async pageMember({
    page,
    pageSize: limit,
    search,
    recent,
    memberId,
  }: MemberPageQuery): Promise<MemberPageResult> {
    let memberIds: number[] | undefined;
    if (recent && memberId) {
      const memberRecentList = await this.prisma.memberRecent.findMany({
        where: { memberId },
        orderBy: { recent: "desc" },
      });
      memberIds = memberRecentList.map((x) => x.relateMemberId);
      if (_.isEmpty(memberIds)) {
        return PagedResult.empty({ page, pageSize: limit });
      }
    }

    return PagedResult.fromPaginationResult(
      await this.prisma.member.paginate({
        include: {
          memberLinkedAccount: true,
        },
        where: {
          AND: {
            id: {
              in: memberIds,
              not: memberId,
            },
            OR: [
              {
                memberLinkedAccount:
                  (search?.length ?? 0) > 20
                    ? {
                        some: {
                          search: {
                            contains: search,
                          },
                        },
                      }
                    : undefined,
              },
              {
                nickname: {
                  contains: search,
                },
              },
            ],
          },
        },
        page,
        limit,
        orderBy: [
          {
            createAt: "desc",
          },
        ],
      })
    );
  }

  async searchMember({ search }: { search: string }): Promise<Member[]> {
    return await this.prisma.member.findMany({
      include: {
        memberLinkedAccount: true,
      },
      where: {
        OR: [
          {
            memberLinkedAccount: {
              some: {
                search: {
                  contains: search,
                },
              },
            },
          },
          {
            nickname: {
              contains: search,
            },
          },
        ],
      },
      orderBy: [
        {
          createAt: "desc",
        },
      ],
    });
  }

  async mappingMember({
    ids,
  }: {
    ids: number[];
  }): Promise<Map<number, MemberOutput>> {
    return new Map((await this.listMember({ ids })).map((x) => [x.id, x]));
  }

  async listMember({ ids }: { ids: number[] }): Promise<MemberOutput[]> {
    if (_.isEmpty(ids)) {
      return [];
    }
    return await this.prisma.member.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        memberLinkedAccount: true,
      },
      orderBy: [
        {
          createAt: "desc",
        },
      ],
    });
  }

  private async findOrCreateMember({
    user,
  }: {
    user: User;
  }): Promise<{ isNew: boolean; member: Member }> {
    const existed = await this.prisma.member.findUnique({
      where: {
        did: user.id,
      },
    });
    if (existed) {
      return {
        isNew: false,
        member: existed,
      };
    }

    const member = await this.prisma.member.create({
      data: {
        did: user.id,
        createdAt: user.createdAt,
      },
    });
    return {
      isNew: true,
      member,
    };
  }

  async findMember({ id }: { id: number }): Promise<MemberOutput | null> {
    return this.prisma.member.findUnique({
      where: { id },
      include: {
        memberLinkedAccount: true,
      },
    });
  }

  async findSmartWalletAddress({
    platform,
    chainId,
    did,
  }: FindMemberSmartWalletInput): Promise<string | null> {
    const chain = await this.prisma.blockChain.findUnique({
      where: {
        platform_chainId: {
          platform,
          chainId,
        },
      },
    });
    if (!chain) {
      throw DATA_NOT_EXIST({ message: "chain not existed" });
    }
    const member = await this.prisma.member.findUnique({
      where: {
        did,
      },
    });
    if (!member) {
      throw DATA_NOT_EXIST({ message: "member not existed" });
    }

    if (chain.smartWalletType === BlockChainSmartWalletType.PRIVY) {
      const user = await this.privy.getUserById(did);
      return user.smartWallet?.address ?? null;
    } else {
      const memberSmartWallet = await this.prisma.memberSmartWallet.findUnique({
        where: {
          platform_chainId_memberId: {
            platform,
            memberId: member.id,
            chainId,
          },
        },
      });
      return memberSmartWallet?.address ?? null;
    }
  }

  async updateMemberRecent({
    memberId,
    trans,
  }: {
    memberId: number;
    trans: TransactionHistory;
  }) {
    if (!trans.receiverMemberId || !trans.senderMemberId) {
      return;
    }
    let relateMemberId;
    let action;
    if (
      memberId === trans.receiverMemberId &&
      memberId !== trans.senderMemberId
    ) {
      relateMemberId = trans.senderMemberId;
      action = MemberRecentAction.RECEIVE;
    } else if (
      memberId !== trans.receiverMemberId &&
      memberId === trans.senderMemberId
    ) {
      relateMemberId = trans.receiverMemberId;
      action = MemberRecentAction.SEND;
    } else {
      return;
    }
    const memberRecent = await this.prisma.memberRecent.findFirst({
      where: {
        memberId,
        relateMemberId,
      },
    });
    if (memberRecent) {
      await this.prisma.memberRecent.update({
        where: {
          id: memberRecent.id,
        },
        data: {
          action,
          recent: new Date(),
        },
      });
    } else {
      await this.prisma.memberRecent.create({
        data: {
          memberId,
          relateMemberId,
          action: action!,
        },
      });
    }
  }

  async updateMemberSmartWallet({
    user,
    smartWallet,
  }: UpdateMemberSmartWalletInput) {
    const member = await this.prisma.member.findUnique({
      where: {
        did: user.id,
      },
    });
    if (!member) {
      throw UNEXPECTED({ message: "member not exist" });
    }
    for (const { platform, chainId, address } of smartWallet) {
      const existed = await this.prisma.memberSmartWallet.findUnique({
        where: {
          platform_chainId_memberId: {
            platform,
            memberId: member.id,
            chainId,
          },
        },
      });
      if (existed) {
        continue;
      }
      await this.prisma.memberSmartWallet.create({
        data: {
          platform,
          memberId: member.id,
          did: member.did,
          chainId,
          address,
        },
      });
    }
  }

  private searchOf({ type, ...rest }: LinkedAccountWithMetadata): string {
    switch (type) {
      case "wallet":
        return (rest as Wallet).address;
      case "smart_wallet":
        return (rest as SmartWallet).address;
      case "email":
        return (rest as Email).address;
      case "phone":
        return (rest as Phone).number;
      case "google_oauth":
        return (rest as Google).email;
      case "twitter_oauth":
        return (rest as Twitter).username ?? "";
      case "discord_oauth":
        return (rest as Discord).username ?? "";
      case "github_oauth":
        return (rest as Github).username ?? "";
      case "apple_oauth":
        return (rest as Apple).email;
      case "linkedin_oauth":
        return (rest as LinkedIn).email;
      case "tiktok_oauth":
        return (rest as Tiktok).username ?? "";
      case "spotify_oauth":
        return (rest as Spotify).email ?? "";
      case "instagram_oauth":
        return (rest as Instagram).username;
      case "custom_auth":
        return (rest as CustomJwt).customUserId;
      case "farcaster":
        return (rest as Farcaster).username ?? "";
      case "telegram":
        return (rest as Telegram).username ?? "";
      case "cross_app":
        return "";
      case "passkey":
        return (rest as PasskeyAccount).credentialId;
      default:
        return "";
    }
  }
}

const MemberLinkedAccountOutput = MemberLinkedAccountSchema.pick({
  type: true,
  search: true,
});

export const MemberSchemas = {
  UpdateMemberInput: z.object({
    nickname: z.string({ description: "昵称" }).optional(),
    avatar: z.string({ description: "头像地址" }).optional(),
  }),
  MemberPageQuery: PageUtils.asPageable(
    z.object({
      search: z.string({ description: "检索条件" }).optional(),
      recent: z
        .enum(["true", "false"], { description: "检索最近交易会员" })
        .transform((val) => val === "true")
        .optional(),
    })
  ),
  MemberPageResult: PageUtils.asPagedResult(
    MemberSchema.extend({
      memberLinkedAccount: z.array(MemberLinkedAccountOutput),
    })
  ),
  MemberOutput: MemberSchema.extend({
    memberLinkedAccount: z.array(MemberLinkedAccountOutput),
  }),
  UpdateMemberSmartWalletInput: z.object({
    smartWallet: z.array(
      z.object({
        platform: z.nativeEnum(BlockChainPlatform, {
          description: "区块链平台",
        }),
        chainId: z.number({ description: "区块链ID" }),
        address: z.string({ description: "智能钱包地址" }),
      })
    ),
  }),
  FindMemberSmartWalletInput: z.object({
    platform: z.nativeEnum(BlockChainPlatform, {
      description: "区块链平台",
    }),
    chainId: z.coerce.number({ description: "区块链ID" }),
    did: z.string({ description: "Privy会员ID" }),
  }),
};

export type UpdateMemberInput = {
  user: User;
} & z.infer<typeof MemberSchemas.UpdateMemberInput>;
export type MemberPageQuery = z.infer<typeof MemberSchemas.MemberPageQuery> & {
  memberId?: number;
};
export type MemberPageResult = z.infer<typeof MemberSchemas.MemberPageResult>;
export type MemberOutput = z.infer<typeof MemberSchemas.MemberOutput>;

export type CustomerMeteData = {
  id?: number;
  nickname?: string;
  avatar?: string;
};

export type UpdateMemberSmartWalletInput = z.infer<
  typeof MemberSchemas.UpdateMemberSmartWalletInput
> & {
  user: User;
};

export type FindMemberSmartWalletInput = z.infer<
  typeof MemberSchemas.FindMemberSmartWalletInput
>;

// @privy-io/server-auth 包未导出该类型，拷贝到此
interface SmartWallet {
  /** The wallet address. */
  address: string;
  /** The provider of the smart wallet. */
  smartWalletType: string;
}

// @privy-io/server-auth 包未导出该类型，拷贝到此
interface PasskeyAccount {
  credentialId: string;
}
