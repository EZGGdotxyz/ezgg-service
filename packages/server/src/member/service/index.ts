import { ContainerModule, interfaces } from "inversify";
import { MemberService } from "./member.service.js";

export * from "./member.service.js";

export const Symbols = {
  MemberService: Symbol.for("MemberService"),
};

export const MemberModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<MemberService>(Symbols.MemberService).to(MemberService);
});
