import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import { PrivyClient, User } from "@privy-io/server-auth";
import { UNAUTHORIZED } from "../core/error.js";

declare module "fastify" {
  interface FastifyInstance {
    privy: PrivyClient;
    privyAuth: (request: any, reply: any) => void;
  }
  interface FastifyRequest {
    privyUser: User | null;
  }
}

const plugins: FastifyPluginAsync = async (fastify) => {
  const privy = new PrivyClient(
    fastify.config.PRIVY_APPID,
    fastify.config.PRIVY_SECRET
  );
  fastify.decorateRequest("privyUser", null);
  fastify.decorate("privy", privy);
  fastify.decorate(
    "privyAuth",
    async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.headers.authorization) {
        throw UNAUTHORIZED({ message: "User Login Required" });
      }
      const accessToken = request.headers.authorization.replace("Bearer ", "");
      try {
        await privy.verifyAuthToken(accessToken);
      } catch (error) {
        fastify.log.warn(`Token verification failed with error ${error}.`);
        throw UNAUTHORIZED({ message: "User Login Expired" });
      }

      const idToken = request.headers["privy-id-token"] as string;
      if (!idToken) {
        throw UNAUTHORIZED({ message: "User Info Required" });
      }
      try {
        request.privyUser = await privy.getUser({ idToken: idToken });
      } catch (error) {
        fastify.log.warn(`Privy getUser failed with error ${error}.`);
        throw UNAUTHORIZED({ message: "User Info Incorrect" });
      }
    }
  );
};

const options: PluginMetadata = {
  name: "privy",
  dependencies: ["config"],
};

export default fp(plugins, options);
