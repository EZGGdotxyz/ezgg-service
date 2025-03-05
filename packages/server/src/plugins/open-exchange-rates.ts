import { FastifyPluginAsync } from "fastify";
import fp, { PluginMetadata } from "fastify-plugin";
import axios from "axios";

declare module "fastify" {
  interface FastifyInstance {
    openExchangeRates: OpenExchangeRates;
  }
}

export interface ExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface OpenExchangeRates {
  latest(force?: boolean): Promise<ExchangeRatesResponse>;
}

const plugins: FastifyPluginAsync = async (fastify) => {
  let cachedResponse: ExchangeRatesResponse | null = null;
  let lastFetchTime: number = 0;

  const fetchExchangeRates = async (): Promise<ExchangeRatesResponse> => {
    const response = await axios.get<ExchangeRatesResponse>(
      `https://openexchangerates.org/api/latest.json?app_id=${fastify.config.OPEN_EXCHANGE_RATES_APP_ID}`
    );
    return response.data;
  };

  fastify.decorate("openExchangeRates", {
    latest: async (force = false): Promise<ExchangeRatesResponse> => {
      const now = Date.now();
      const eightHoursInMillis = 8 * 60 * 60 * 1000;

      if (
        force ||
        !cachedResponse ||
        now - lastFetchTime > eightHoursInMillis
      ) {
        cachedResponse = await fetchExchangeRates();
        lastFetchTime = now;
      }

      return cachedResponse;
    },
  });
};

const options: PluginMetadata = {
  name: "open-exchange-rates",
  dependencies: ["config"],
};

export default fp(plugins, options);
