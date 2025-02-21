export interface ErrorOptions {
  message?: string;
  code?: string;
  cause?: unknown;
  args?: any[];
}

export class ServiceError extends Error {
  code: string;
  constructor(code: string, message: string, cause: unknown) {
    super(message, { cause });
    this.code = code;
  }
}

export type ErrBuilder = (opts: ErrorOptions) => Error;
export type ErrWarper = (options?: ErrorOptions, ...args: any[]) => Error;

const delegateErrBuilder = (opts: ErrorOptions) =>
  (customerErrBuilder ?? defaultErrBuilder)(opts);

let customerErrBuilder: ErrBuilder | undefined = undefined;

const createErrorWarper =
  (builder: ErrBuilder) =>
  (presets: ErrorOptions) =>
  (options: ErrorOptions = {}, ...args: any[]) =>
    builder({
      ...presets,
      ...options,
      args,
    });

export const wrapError = createErrorWarper(delegateErrBuilder);

export const UNEXPECTED = wrapError({
  code: "50000",
  message: "系统繁忙，请稍后再试。",
});

export const UNAUTHORIZED = wrapError({
  code: "50401",
  message: "未授权访问，请登录系统后再试。",
});

export const PARAMETER_ERROR = wrapError({
  code: "50400",
  message: "参数异常，请确认输入是否正确。",
});

export const DATA_NOT_EXIST = wrapError({
  code: "50404",
  message: "查找的数据不存在。",
});

export function setupErrBuilder(errBuilder: ErrBuilder) {
  customerErrBuilder = errBuilder;
}

export const defaultErrBuilder = (opts: ErrorOptions) =>
  new ServiceError(
    opts.code || "50000",
    opts.message || "服务器繁忙，请稍后再试",
    opts.cause
  );
