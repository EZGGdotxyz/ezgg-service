import fp, { PluginMetadata } from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import Inversify from "../core/fastify-inversify.js";
import { ExtendPrismaClient as PrismaClient } from "./prisma.js";
import { ContainerModule, interfaces } from "inversify";
import { Symbols } from "../identifier.js";
import { AdminModule } from "../admin/service/index.js";
import { PrivyClient } from "@privy-io/server-auth";
import { MemberModule } from "../member/service/index.js";
import { AlchemyFactory } from "./alchemy.js";
import { fileURLToPath } from "url";
import * as path from "path";
import { OpenExchangeRates } from "./open-exchange-rates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plugins: FastifyPluginAsync = async (fastify) => {
  const ProviderModule = new ContainerModule((bind: interfaces.Bind) => {
    bind<FastifyInstance>(Symbols.Fastify).toConstantValue(fastify);
    bind<PrismaClient>(Symbols.PrismaClient).toConstantValue(fastify.prisma);
    bind<PrivyClient>(Symbols.PrivyClient).toConstantValue(fastify.privy);
    bind<AlchemyFactory>(Symbols.AlchemyFactory).toConstantValue(
      fastify.alchemy
    );
    bind<string>(Symbols.ROOT_PATH).toConstantValue(
      path.dirname(path.dirname(__dirname))
    );
    bind<OpenExchangeRates>(Symbols.OpenExchangeRates).toConstantValue(
      fastify.openExchangeRates
    );
  });

  fastify.register(Inversify, {
    defaultScope: "Singleton",
    modules: [ProviderModule, AdminModule, MemberModule],
  });
};

const options: PluginMetadata = {
  name: "inversify",
  dependencies: ["prisma", "privy", "alchemy", "open-exchange-rates"],
};

export default fp(plugins, options);
