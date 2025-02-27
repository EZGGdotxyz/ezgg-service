import { FastifyPluginAsync } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import { Alchemy, Network } from "alchemy-sdk";

declare module "fastify" {
  interface FastifyInstance {
    alchemy: AlchemyFactory;
  }
}

export interface AlchemyFactory {
  get(network: Network): Alchemy;
}

const plugins: FastifyPluginAsync = async (fastify) => {
  const cached = new Map<Network, Alchemy>();

  fastify.decorate("alchemy", {
    get: (network: Network): Alchemy => {
      if (!cached.has(network)) {
        cached.set(
          network,
          new Alchemy({
            apiKey: fastify.config.ALCHEMY_API_KEY,
            network,
          })
        );
      }
      return cached.get(network)!;
    },
  });
};

const options: PluginMetadata = {
  name: "alchemy",
  dependencies: ["config"],
};

export default fp(plugins, options);
