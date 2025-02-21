import fp from "fastify-plugin";
import Env from "@fastify/env";
import { FastifyPluginAsync } from "fastify";
import { Environment, EnvironmentSchema } from "../core/model.js";
import { zodToJsonSchema } from "zod-to-json-schema";

declare module "fastify" {
  interface FastifyInstance {
    config: Environment;
  }
}

const Plugins: FastifyPluginAsync = async (fastify) => {
  fastify.register(Env, {
    schema: zodToJsonSchema(EnvironmentSchema),
  });
};

const options = {
  name: "config",
};

export default fp(Plugins, options);
