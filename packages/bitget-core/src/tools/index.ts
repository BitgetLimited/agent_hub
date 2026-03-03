import type { BitgetConfig } from "../config.js";
import { registerAccountTools } from "./account.js";
import { registerBrokerTools } from "./broker.js";
import { registerConvertTools } from "./convert.js";
import { registerCopyTradingTools } from "./copy-trading.js";
import { registerEarnTools } from "./earn.js";
import { registerFuturesMarketTools } from "./futures-market.js";
import { registerFuturesTradeTools } from "./futures-trade.js";
import { registerMarginTools } from "./margin.js";
import { registerP2pTools } from "./p2p.js";
import { registerSpotMarketTools } from "./spot-market.js";
import { registerSpotTradeTools } from "./spot-trade.js";
import type { ToolSpec } from "./types.js";

function allToolSpecs(): ToolSpec[] {
  return [
    ...registerSpotMarketTools(),
    ...registerSpotTradeTools(),
    ...registerFuturesMarketTools(),
    ...registerFuturesTradeTools(),
    ...registerAccountTools(),
    ...registerMarginTools(),
    ...registerCopyTradingTools(),
    ...registerConvertTools(),
    ...registerEarnTools(),
    ...registerP2pTools(),
    ...registerBrokerTools(),
  ];
}

export function buildTools(config: BitgetConfig): ToolSpec[] {
  const enabledModules = new Set(config.modules);
  const tools = allToolSpecs().filter((tool) => enabledModules.has(tool.module));
  if (!config.readOnly) {
    return tools;
  }
  return tools.filter((tool) => !tool.isWrite);
}
