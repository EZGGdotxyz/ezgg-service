import { injectable, inject } from "inversify";
import { Symbols } from "../../identifier.js";
import type { ExtendPrismaClient as PrismaClient } from "../../plugins/prisma.js";
import { SettingSchema } from "../../../prisma/generated/zod/index.js";
import { z } from "zod";

const defaultSetting: SettingOutput = {
  memberId: 0,
  notifyTransUpdate: true,
  notifyAbnormalAlarm: true,
  notifyPayRequest: true,
  notifyCardActivity: true,
  notifyCustomerSupport: true,
  notifyBalanceAlarm: true,
  notifySecureAlarm: true,
  notifySummary: true,
  sysAppUpdate: true,
  sysSalesPromotion: true,
  sysSurvey: true,
};

@injectable()
export class SettingService {
  constructor(
    @inject(Symbols.PrismaClient)
    private readonly prisma: PrismaClient
  ) {}

  async updateSetting(input: SettingUpdateInput): Promise<SettingOutput> {
    const { memberId, ...data } = input;
    const setting = await this.prisma.setting.findUnique({
      where: { memberId },
    });
    if (!setting) {
      await this.prisma.setting.create({
        data: {
          ...input,
        },
      });
    } else {
      await this.prisma.setting.update({
        data,
        where: {
          id: setting.id,
        },
      });
    }
    return (await this.prisma.setting.findUnique({ where: { memberId } }))!;
  }

  async findSetting({
    memberId,
  }: {
    memberId: number;
  }): Promise<SettingOutput> {
    const setting = await this.prisma.setting.findUnique({
      where: { memberId },
    });
    if (!setting) {
      return defaultSetting;
    } else {
      return setting;
    }
  }
}

export const SettingSchemas = {
  SettingUpdateInput: SettingSchema.omit({
    id: true,
    createBy: true,
    updateBy: true,
    createAt: true,
    updateAt: true,
    deleteAt: true,
  }),
  SettingOutput: SettingSchema.omit({
    id: true,
    createBy: true,
    updateBy: true,
    createAt: true,
    updateAt: true,
    deleteAt: true,
  }),
};

export type SettingUpdateInput = z.infer<
  typeof SettingSchemas.SettingUpdateInput
> & { memberId: number };
export type SettingOutput = z.infer<typeof SettingSchemas.SettingOutput>;
