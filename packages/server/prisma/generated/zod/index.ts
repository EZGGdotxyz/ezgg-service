import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const SysUserScalarFieldEnumSchema = z.enum(['id','deleted','createBy','updateBy','createAt','updateAt','deleteAt','name','username','password','phone','mail','remark','enabled']);

export const MemberScalarFieldEnumSchema = z.enum(['id','deleted','createBy','updateBy','createAt','updateAt','deleteAt','did','createdAt','nickname','avatar']);

export const MemberLinkedAccountScalarFieldEnumSchema = z.enum(['id','deleted','createBy','updateBy','createAt','updateAt','deleteAt','memberId','did','type','detail','search']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullsOrderSchema = z.enum(['first','last']);

export const SysUserOrderByRelevanceFieldEnumSchema = z.enum(['name','username','password','phone','mail','remark']);

export const MemberOrderByRelevanceFieldEnumSchema = z.enum(['did','nickname','avatar']);

export const MemberLinkedAccountOrderByRelevanceFieldEnumSchema = z.enum(['did','type','detail','search']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// SYS USER SCHEMA
/////////////////////////////////////////

export const SysUserSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  deleteAt: z.number().int().describe("删除时间"),
  /**
   * 管理员
   */
  name: z.string().describe("管理员"),
  /**
   * 用户账户
   */
  username: z.string().describe("用户账户"),
  /**
   * 密码
   */
  password: z.string().describe("密码"),
  /**
   * 手机号码
   */
  phone: z.string().nullable().describe("手机号码"),
  /**
   * 电子邮箱
   */
  mail: z.string().nullable().describe("电子邮箱"),
  /**
   * 备注信息
   */
  remark: z.string().nullable().describe("备注信息"),
  /**
   * 停用/启用标识；false 停用；true 启用
   */
  enabled: z.boolean().describe("停用/启用标识；false 停用；true 启用"),
})

export type SysUser = z.infer<typeof SysUserSchema>

/////////////////////////////////////////
// MEMBER SCHEMA
/////////////////////////////////////////

export const MemberSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  deleteAt: z.number().int().describe("删除时间"),
  /**
   * Privy User DID
   */
  did: z.string().describe("Privy User DID"),
  /**
   * Privy User 创建时间
   */
  createdAt: z.coerce.date().describe("Privy User 创建时间"),
  /**
   * 昵称
   */
  nickname: z.string().nullable().describe("昵称"),
  /**
   * 头像地址
   */
  avatar: z.string().nullable().describe("头像地址"),
})

export type Member = z.infer<typeof MemberSchema>

/////////////////////////////////////////
// MEMBER LINKED ACCOUNT SCHEMA
/////////////////////////////////////////

export const MemberLinkedAccountSchema = z.object({
  /**
   * 主键
   */
  id: z.number().int().describe("主键"),
  /**
   * 是否删除
   */
  // omitted: deleted: z.number().int().describe("是否删除"),
  /**
   * 创建人 id
   */
  createBy: z.number().int().describe("创建人 id"),
  /**
   * 修改人 id
   */
  updateBy: z.number().int().describe("修改人 id"),
  /**
   * 创建时间
   */
  createAt: z.coerce.date().describe("创建时间"),
  /**
   * 修改时间
   */
  updateAt: z.coerce.date().describe("修改时间"),
  /**
   * 删除时间
   */
  deleteAt: z.number().int().describe("删除时间"),
  /**
   * 用户id
   */
  memberId: z.number().int().describe("用户id"),
  /**
   * Privy User DID
   */
  did: z.string().describe("Privy User DID"),
  /**
   * Privy User LinkedAccount的类型
   */
  type: z.string().describe("Privy User LinkedAccount的类型"),
  /**
   * Privy User 绑定账号详情JSON
   */
  detail: z.string().describe("Privy User 绑定账号详情JSON"),
  /**
   * 从detail提取的用于检索的字段
   */
  search: z.string().describe("从detail提取的用于检索的字段"),
})

export type MemberLinkedAccount = z.infer<typeof MemberLinkedAccountSchema>
