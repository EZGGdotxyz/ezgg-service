import fp from "fastify-plugin";
import Swagger, { SwaggerOptions } from "@fastify/swagger";
import SwaggerUI from "@fastify/swagger-ui";
import { FastifyPluginAsync } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { ApiDocumentUI } from "../../core/model.js";

const version = "1";

const swaggerGenerator: FastifyPluginAsync<SwaggerOptions> = async (
  fastify,
  opts
) => {
  // Swagger documentation generator for Fastify.
  // It uses the schemas you declare in your routes to generate a swagger compliant doc.
  // https://github.com/fastify/fastify-swagger
  await fastify.register(Swagger, {
    openapi: {
      info: {
        title: "Fastify URL Shortener",
        description: "Fastify URL Shortener documentation",
        version,
      },
      externalDocs: {
        url: "https://github.com/delvedor/fastify-example",
        description: "Find more info here",
      },
      components: {
        securitySchemes: {
          authorization: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  if (fastify.config.API_DOCUMENT_UI !== ApiDocumentUI.NONE) {
    if (fastify.config.API_DOCUMENT_UI === ApiDocumentUI.SWAGGER_UI) {
      await fastify.register(SwaggerUI, {
        routePrefix: "/doc",
      });
    } else if (fastify.config.API_DOCUMENT_UI === ApiDocumentUI.SCALAR) {
      await fastify.register(ScalarApiReference, {
        routePrefix: "/doc",
        configuration: {
          theme: "default",
        },
      });
    }
  }
};

export default fp(swaggerGenerator, {
  name: "swaggerGenerator",
});
