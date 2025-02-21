import { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyServerOptions } from "fastify";

export type AppOptions = {
  // Place your custom options for app below here.
} & FastifyServerOptions &
  Partial<AutoloadPluginOptions>;
