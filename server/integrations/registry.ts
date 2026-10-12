import {
  AdapterNotRegisteredError,
  MARKETPLACE_CODES,
  UnknownMarketplaceError,
  type MarketplaceAdapter,
  type MarketplaceCode,
} from "./types";

export type AdapterFactory<Ctx> = (ctx: Ctx) => MarketplaceAdapter;

// A factory function (no module-level state) so every test and app gets its own registry.
export function createAdapterRegistry<Ctx = void>() {
  const factories = new Map<MarketplaceCode, AdapterFactory<Ctx>>();
  return {
    register(code: MarketplaceCode, factory: AdapterFactory<Ctx>) {
      factories.set(code, factory);
    },
    create(code: string, ctx: Ctx): MarketplaceAdapter {
      if (!(MARKETPLACE_CODES as readonly string[]).includes(code)) throw new UnknownMarketplaceError(code);
      const factory = factories.get(code as MarketplaceCode);
      if (!factory) throw new AdapterNotRegisteredError(code as MarketplaceCode);
      return factory(ctx);
    },
  };
}
