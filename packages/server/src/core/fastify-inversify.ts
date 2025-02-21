import { FastifyPluginAsync } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import { Container, interfaces } from "inversify";

declare module "fastify" {
  interface FastifyInstance {
    diContainer: interfaces.Container;
    injectFastify: typeof InjectRequest;
    injectRequest: typeof InjectRequest;
    useInjectable: typeof UseInjectable;
  }
}

declare function InjectRequest(requirement: {
  [property: string]: interfaces.ServiceIdentifier;
}): void;

type InjectPoint = {
  [property: string]: [interfaces.ServiceIdentifier, interfaces.Newable];
};

type Injectable<T extends InjectPoint> = {
  inject: T;
  postInject?: (instance: InjectedInstance<T>) => void | Promise<void>;
};

type InjectedInstance<I extends InjectPoint> = {
  [K in keyof I]: I[K][1] extends interfaces.Newable<infer U> ? U : never;
};

declare function UseInjectable<T extends InjectPoint>(
  injectable: Injectable<T>
): Injectable<T>["postInject"] extends (...args: any[]) => Promise<void>
  ? Promise<InjectedInstance<T>>
  : InjectedInstance<T>;

export type FastifyInversifyOptions = interfaces.ContainerOptions & {
  parent?: interfaces.Container;
  modules?: interfaces.ContainerModule[];
  asyncModule?: interfaces.AsyncContainerModule[];
  warmUp?: (container: interfaces.Container) => void | Promise<void>;
};

const plugins: FastifyPluginAsync<FastifyInversifyOptions> = async (
  fastify,
  options
) => {
  const container = new Container(options);
  const { parent, asyncModule, modules, warmUp } = options;

  if (parent) {
    container.parent = parent;
  }

  if (asyncModule) {
    fastify.log.info("FastifyInversify Start load async modules", modules);
    await container.loadAsync(...asyncModule);
  }
  if (modules) {
    fastify.log.info("FastifyInversify Start load modules", modules);
    container.load(...modules);
  }

  if (warmUp) {
    fastify.log.info("FastifyInversify Start warm up");
    await warmUp(container);
  }

  fastify.decorate("diContainer", container);

  fastify.decorate("injectFastify", function (requirement) {
    Object.entries(requirement).forEach(([property, identifier]) => {
      this.decorate(property, {
        getter<T>() {
          return container.get<T>(identifier);
        },
      });
    });
  });

  fastify.decorate("injectRequest", function (requirement) {
    Object.entries(requirement).forEach(([property, identifier]) => {
      this.decorateRequest(property, {
        getter<T>() {
          return container.get<T>(identifier);
        },
      });
    });
  });

  fastify.decorate("useInjectable", function (injectable) {
    const instance = {};
    for (const [property, [identifier]] of Object.entries(injectable.inject)) {
      Object.defineProperty(instance, property, {
        get() {
          return container.get(identifier);
        },
      });
    }

    if (injectable.postInject) {
      const postInjectResult = injectable.postInject(instance);
      if (postInjectResult instanceof Promise) {
        // 如果 postInject 返回 Promise，则等待它完成
        return postInjectResult.then(() => instance);
      }
    }

    return instance;
  });

  fastify.addHook("onClose", async () => {
    fastify.log.info("FastifyInversify going unbind all");
    await container.unbindAllAsync();
  });
};

const options: PluginMetadata = {
  name: "FastifyInversify",
  dependencies: [],
};

export default fp(plugins, options);
