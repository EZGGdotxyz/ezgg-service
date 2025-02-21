import { inject, injectable } from "inversify";
import type { ExtendPrismaClient as PrismaClient } from "../../../plugins/prisma.js";
import { Symbols } from "../../../identifier.js";
import { z } from "zod";
import { DATA_NOT_EXIST, PARAMETER_ERROR } from "../../../core/error.js";
import * as _ from "radash";
import { encodePassword } from "../../../core/utils.js";
import { PagedResult, PageUtils } from "../../../core/model.js";
import { SysUserSchema } from "../../../../prisma/generated/zod/index.js";

@injectable()
export class SysUserService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async createSysUser(input: CreateSysUserInput): Promise<SysUserOutput> {
    await this.isUsernameDuplicate(input);
    await this.isPhoneDuplicate(input);
    await this.isMailDuplicate(input);

    const password = await encodePassword(input.password);
    const { confirmPassword, ...data } = input;
    const result = await this.prisma.sysUser.create({
      data: { ...data, password },
    });
    const { password: x, ...rest } = result;
    return rest;
  }

  async deleteSysUser({ id }: SysUserIdentity): Promise<SysUserOutput> {
    const sysUser = await this.prisma.sysUser.findUnique({
      where: { id },
    });
    if (!sysUser) {
      throw DATA_NOT_EXIST({
        message: `Admin with id ${id} is not found`,
      });
    }

    const result = await this.prisma.sysUser.delete({ where: { id } });
    const { password: x, ...rest } = result;
    return rest;
  }

  async updateSysUser({
    id,
    payload,
  }: {
    id: number;
    payload: UpdateSysUserInput;
  }): Promise<SysUserOutput> {
    const sysUser = await this.prisma.sysUser.findUnique({
      where: { id },
    });
    if (!sysUser) {
      throw DATA_NOT_EXIST({
        code: "NOT_FOUND",
        message: `Admin with id ${id} is not found`,
      });
    }

    let data = { ...payload, password: sysUser.password };
    if (payload.password && payload.confirmPassword) {
      const password = await encodePassword(payload.password);
      const { confirmPassword, ...rest } = payload;
      data = { ...rest, password };
    }

    const result = await this.prisma.sysUser.update({
      data,
      where: { id },
    });
    const { password: x, ...rest } = result;
    return rest;
  }

  async findSysUserById({
    id,
  }: SysUserIdentity): Promise<SysUserOutput | null> {
    const result = await this.prisma.sysUser.findUnique({ where: { id } });
    if (!result) {
      return null;
    }
    const { password, ...rest } = result;
    return rest;
  }

  async pageSysUser({
    page,
    pageSize,
    name,
    username,
    phone,
    mail,
    createTimeStart,
    createTimeEnd,
    enabled,
  }: SysUserQuery): Promise<SysUserPage> {
    const where = {
      name: {
        contains: name,
      },
      username: {
        contains: username,
      },
      phone: {
        contains: phone,
      },
      mail: {
        contains: mail,
      },
      createAt: {
        gte: createTimeStart,
        lte: createTimeEnd,
      },
      enabled: enabled,
    };
    const pageResult = await this.prisma.sysUser.paginate({
      where,
      page,
      limit: pageSize,
    });
    return PagedResult.fromPaginationResult(pageResult);
  }

  private async isUsernameDuplicate({ username }: CreateSysUserInput) {
    if (_.isEmpty(username)) {
      return;
    }
    const existUser = await this.prisma.sysUser.findUnique({
      where: { username },
    });
    if (existUser) {
      throw PARAMETER_ERROR({
        message: `Admin with username ${username} is exist`,
      });
    }
  }
  private async isPhoneDuplicate({ phone }: CreateSysUserInput) {
    if (_.isEmpty(phone)) {
      return;
    }
    const existUser = await this.prisma.sysUser.findUnique({
      where: { phone },
    });
    if (existUser) {
      throw PARAMETER_ERROR({
        message: `Admin with phone ${phone} is exist`,
      });
    }
  }
  private async isMailDuplicate({ mail }: CreateSysUserInput) {
    if (_.isEmpty(mail)) {
      return;
    }
    const existUser = await this.prisma.sysUser.findUnique({
      where: { mail },
    });
    if (existUser) {
      throw PARAMETER_ERROR({
        message: `Admin with mail ${mail} is exist`,
      });
    }
  }
}

const SysUserOutputSchema = SysUserSchema.omit({
  password: true,
});

export const SysUserSchemas = {
  SysUserIdentity: z.object({
    id: z.number(),
  }),
  SysUserOutput: SysUserOutputSchema,
  CreateSysUserInput: z
    .object({
      name: z
        .string()
        .min(1, "Missing admin name")
        .max(32, "Admin name too long"),
      username: z
        .string()
        .min(1, "Missing admin username")
        .max(64, "Admin username too long"),
      password: z.string().min(1, "Missing password"),
      confirmPassword: z.string().min(1, "Mising password confirm"),
      phone: z.string().optional(),
      mail: z.string().email("Incorrect email format").optional(),
      remark: z.string().max(255, "Remark too long").optional(),
      enabled: z.boolean().optional(),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      message: "Two passwords must match",
      path: ["confirmPassword"],
    }),
  UpdateSysUserInput: z
    .object({
      name: z
        .string()
        .min(1, "Missing admin name")
        .max(32, "Admin name too long"),
      username: z
        .string()
        .min(1, "Missing admin username")
        .max(64, "Admin username too long"),
      password: z.string().nullish(),
      confirmPassword: z.string().nullish(),
      phone: z.string().nullish(),
      mail: z.string().email("Incorrect email format").nullish(),
      remark: z.string().max(255, "Remark too long").nullish(),
      enabled: z.boolean(),
    })
    .refine(
      ({ password, confirmPassword }) =>
        password === confirmPassword || (!password && !confirmPassword),
      {
        message: "Two passwords must match",
        path: ["confirmPassword"],
      }
    ),
  SysUserQuery: PageUtils.asPageable(
    z.object({
      name: z.string().optional(),
      username: z.string().optional(),
      phone: z.string().optional(),
      mail: z.string().optional(),
      createTimeStart: z.date().optional(),
      createTimeEnd: z.date().optional(),
      enabled: z.boolean().optional(),
    })
  ),
  SysUserPage: PageUtils.asPagedResult(SysUserOutputSchema),
};

export type SysUserIdentity = z.infer<typeof SysUserSchemas.SysUserIdentity>;
export type SysUserOutput = z.infer<typeof SysUserSchemas.SysUserOutput>;
export type CreateSysUserInput = z.infer<
  typeof SysUserSchemas.CreateSysUserInput
>;
export type UpdateSysUserInput = z.infer<
  typeof SysUserSchemas.UpdateSysUserInput
>;
export type SysUserQuery = z.infer<typeof SysUserSchemas.SysUserQuery>;
export type SysUserPage = z.infer<typeof SysUserSchemas.SysUserPage>;
