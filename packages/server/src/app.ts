import * as path from "path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import { fileURLToPath } from "url";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { ServiceError } from "./core/error.js";
import { ZodError } from "zod";
import { ApiUtils } from "./core/model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AppOptions = {
  // Place your custom options for app below here.
} & FastifyServerOptions &
  Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  logger: {
    level: "debug",
    transport: {
      target: "pino-pretty",
    },
  },
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.register(fastifyCookie, {});
  fastify.register(fastifyStatic, {
    root: path.join(path.dirname(__dirname), "public"),
    prefix: "/public/", // optional: default '/'
    constraints: {}, // optional: default {}
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ServiceError) {
      reply.status(200).send(ApiUtils.error(error.code, error.message));
    } else if (error instanceof ZodError) {
      request.log.error(error);
      reply.status(200).send(ApiUtils.error("40000", error.errors[0].message));
    } else {
      request.log.error(error);
      reply
        .status(200)
        .send(ApiUtils.error("50000", error.message ?? String(error)));
    }
  });

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: opts,
    forceESM: true,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: opts,
    forceESM: true,
  });

  void fastify.register((f, opts, done) => {
    void f.register(AutoLoad, {
      dir: path.join(__dirname, "member", "plugins"),
      options: opts,
      forceESM: true,
    });

    void f.register(AutoLoad, {
      dir: path.join(__dirname, "member", "routes"),
      options: opts,
      forceESM: true,
    });

    done();
  });

  void fastify.register((f, opts, done) => {
    // void f.register(AutoLoad, {
    //   dir: path.join(__dirname, "admin", "plugins"),
    //   options: opts,
    //   forceESM: true,
    // });

    // void f.register(AutoLoad, {
    //   dir: path.join(__dirname, "admin", "routes"),
    //   options: opts,
    //   forceESM: true,
    // });

    done();
  });
};

export default app;
export { app, options };
