import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import fastifyRequestContextPlugin from "@fastify/request-context";

declare module "fastify" {
  interface FastifyInstance {
    useTrans: <R>(fn: () => Promise<R>) => Promise<R>;
  }
  namespace fastifyRequestContext {
    interface RequestContextData {
      currentUserId: number;
      transactionalDb: FastifyInstance["prisma"];
    }
  }
}

const Plugins: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyRequestContextPlugin);
  fastify.decorate("useTrans", async <R>(fn: () => Promise<R>): Promise<R> => {
    return fastify.prisma.$transaction((db) => {
      fastify.requestContext.set("transactionalDb", db);
      return fn();
    });
  });
};

const options = {
  name: "tx",
  dependencies: ["prisma"],
};

export default fp(Plugins, options);
