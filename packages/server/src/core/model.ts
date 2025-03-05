import { z } from "zod";
import { IPaginationResult } from "prisma-paginate";

export const Pageable = z.object({
  page: z.coerce.number({ description: "页码，默认1" }).default(1),
  pageSize: z.coerce.number({ description: "每页记录数，默认30" }).default(30),
});

const asPageable = <T extends ReturnType<typeof z.object>>(type: T) => {
  return Pageable.merge(type);
};

const asPagedResult = <T extends z.ZodTypeAny>(recordType: T) => {
  return Pageable.extend({
    pageCount: z.number({ description: "总页数" }),
    totalCount: z.number({ description: "总记录数" }),
    record: z.array(recordType),
  });
};

const asApiResult = <T extends z.ZodTypeAny>(recordType: T) => {
  return z.object({
    code: z.string(),
    msg: z.string(),
    data: recordType.nullish(),
  });
};

export type ApiResult<T> = {
  code: string;
  msg: string;
  data: T;
};

export const PagedResult = {
  fromPaginationResult: <Result extends unknown[] = unknown[]>(
    paginationResult: IPaginationResult<Result>
  ) => {
    return {
      page: paginationResult.page,
      pageSize: paginationResult.limit,
      pageCount: paginationResult.totalPages,
      totalCount: paginationResult.count,
      record: paginationResult.result,
    };
  },
  empty: ({ page, pageSize }: { page: number; pageSize: number }) => ({
    page,
    pageSize,
    pageCount: 0,
    totalCount: 0,
    record: [],
  }),
};

export const PageUtils = {
  asPageable,
  asPagedResult,
};

export const ApiUtils = {
  asApiResult,
  ok: <T>(data: T): ApiResult<T> => ({
    code: "0",
    msg: "success",
    data,
  }),
  error: (code: string, msg: string): ApiResult<null> => ({
    code,
    msg,
    data: null,
  }),
  isApiResult: (value: unknown) =>
    value &&
    (value as ApiResult<unknown>).code !== undefined &&
    (value as ApiResult<unknown>).msg !== undefined &&
    (value as ApiResult<unknown>).data !== undefined,
};

export enum ApiDocumentUI {
  NONE = "NONE",
  SWAGGER_UI = "SWAGGER_UI",
  SCALAR = "SCALAR",
}

export const EnvironmentSchema = z.object({
  DATABASE_URL: z.string(),
  API_DOCUMENT_UI: z.nativeEnum(ApiDocumentUI).default(ApiDocumentUI.NONE),
  JWT_TOKEN_SECRET: z.string(),
  JWT_COOKIE_NAME: z.string(),
  JWT_COOKIE_DOMAIN: z.string(),
  JWT_CORS_ORIGIN: z.string().optional(),
  PRIVY_APPID: z.string(),
  PRIVY_SECRET: z.string(),
  ALCHEMY_API_KEY: z.string(),
  MAX_FILE_SIZE: z.number().optional(),
  FILE_BASE_URL: z.string(),
  OPEN_EXCHANGE_RATES_APP_ID: z.string(), // 新增环境变量
});

// fastify.getEnvs<Environment>()
export type Environment = z.infer<typeof EnvironmentSchema>;

export type OwnerRequired = {
  memberId: number;
};
