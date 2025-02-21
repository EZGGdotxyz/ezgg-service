import { ContainerModule, interfaces } from "inversify";
import { SysUserService } from "./system/sys-user.service.js";

export * from "./system/sys-user.service.js";

export const Symbols = {
  SysUserService: Symbol.for("SysUserService"),
};

export const AdminModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<SysUserService>(Symbols.SysUserService).to(SysUserService);
});
