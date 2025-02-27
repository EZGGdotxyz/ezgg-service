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
import { Member, Prisma } from "@prisma/client";
import { DATA_NOT_EXIST } from "../../core/error.js";
import { PagedResult, PageUtils } from "../../core/model.js";
import {
  MemberLinkedAccountSchema,
  MemberSchema,
} from "../../../prisma/generated/zod/index.js";
import * as _ from "radash";
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
    await this.syncLinkedAccounts({ user });
    await this.prisma.$transaction(async (tx) => {
      await tx.member.update({
        data: {
          nickname,
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
      for (const linkedAccount of user.linkedAccounts) {
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

  async pageMember(input: MemberPageQuery): Promise<MemberPageResult> {
    return PagedResult.fromPaginationResult(
      await this.prisma.member.paginate({
        include: {
          memberLinkedAccount: true,
        },
        where: {
          OR: [
            {
              memberLinkedAccount: {
                some: {
                  search: {
                    contains: input.search,
                  },
                },
              },
            },
            {
              nickname: {
                contains: input.search,
              },
            },
          ],
        },
        page: input.page,
        limit: input.pageSize,
        orderBy: [
          {
            createAt: "desc",
          },
        ],
      })
    );
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

  async findMember({ id }: { id: number }): Promise<Member | null> {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async findSmartWalletAddress({
    did,
  }: {
    did: string;
  }): Promise<string | null> {
    const user = await this.privy.getUserById(did);
    return user.smartWallet?.address ?? null;
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

export const MemberSchemas = {
  UpdateMemberInput: z.object({
    nickname: z.string({ description: "昵称" }).optional(),
    avatar: z.string({ description: "头像地址" }).optional(),
  }),
  MemberPageQuery: PageUtils.asPageable(
    z.object({
      search: z.string({ description: "检索条件" }).optional(),
    })
  ),
  MemberPageResult: PageUtils.asPagedResult(
    MemberSchema.extend({
      memberLinkedAccount: z.array(MemberLinkedAccountSchema),
    })
  ),
  MemberOutput: MemberSchema.extend({
    memberLinkedAccount: z.array(MemberLinkedAccountSchema),
  }),
};

export type UpdateMemberInput = {
  user: User;
} & z.infer<typeof MemberSchemas.UpdateMemberInput>;
export type MemberPageQuery = z.infer<typeof MemberSchemas.MemberPageQuery>;
export type MemberPageResult = z.infer<typeof MemberSchemas.MemberPageResult>;
export type MemberOutput = z.infer<typeof MemberSchemas.MemberOutput>;

export type CustomerMeteData = {
  id?: number;
  nickname?: string;
  avatar?: string;
};

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
