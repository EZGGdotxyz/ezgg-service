import { ContainerModule, interfaces } from "inversify";
import {
  BlockChainService,
  BizContractService,
} from "./infrastructure.service.js";
import { MemberService } from "./member.service.js";
import { TransactionHistoryService } from "./transaction.service.js";
import { PayLinkService } from "./paylink.service.js";
import { Symbols } from "./identifier.js";
import { SettingService } from "./setting.service.js";

export * from "./identifier.js";
export * from "./infrastructure.service.js";
export * from "./transaction.service.js";
export * from "./paylink.service.js";
export * from "./member.service.js";
export * from "./setting.service.js";

export const MemberModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<BlockChainService>(Symbols.BlockChainService).to(BlockChainService);
  bind<BizContractService>(Symbols.BizContractService).to(BizContractService);
  bind<MemberService>(Symbols.MemberService).to(MemberService);
  bind<TransactionHistoryService>(Symbols.TransactionHistoryService).to(
    TransactionHistoryService
  );
  bind<PayLinkService>(Symbols.PayLinkService).to(PayLinkService);
  bind<SettingService>(Symbols.SettingService).to(SettingService);
});
