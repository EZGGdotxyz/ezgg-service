import { FastifyPluginAsync } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import { createClient, http } from "viem";
import {
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  bsc,
  bscTestnet,
} from "viem/chains";
import { PARAMETER_ERROR } from "../core/error.js";
import { BlockChainPlatform } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    viem: ViemClients;
  }
}

export interface ViemClients {
  client(chainId: number): Promise<ViemClient>;
}

export type ViemClient = ReturnType<typeof createClient>;

const chains = [base, baseSepolia, polygon, polygonAmoy, bsc, bscTestnet];

const plugins: FastifyPluginAsync = async (fastify) => {
  const cached = new Map<number, ViemClient>();

  fastify.decorate("viem", {
    client: async (chainId: number): Promise<ViemClient> => {
      if (!cached.has(chainId)) {
        const blockChain = await fastify.prisma.blockChain.findUnique({
          where: {
            platform_chainId: { platform: BlockChainPlatform.ETH, chainId },
          },
        });
        if (!blockChain) {
          throw PARAMETER_ERROR({
            message: `Not supported chain id ${chainId}`,
          });
        }

        const chain = chains.find((x) => x.id == chainId);
        if (!chain) {
          throw PARAMETER_ERROR({
            message: `Not supported chain id ${chainId}`,
          });
        }
        cached.set(
          chainId,
          createClient({
            chain,
            transport: http(
              `${blockChain?.alchemyRpc}/${fastify.config.ALCHEMY_API_KEY}`
            ),
          })
        );
      }
      return cached.get(chainId)!;
    },
  });
};

const options: PluginMetadata = {
  name: "viem-client",
  dependencies: ["config", "prisma"],
};

export default fp(plugins, options);
