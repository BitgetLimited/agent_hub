// Centralized Bitget REST API V2 endpoint paths, grouped by module.
// Replaces the unmaintained `bitget-api-node-sdk` dependency.
export { SPOT_ENDPOINTS } from './spot.js';
export { FUTURES_ENDPOINTS } from './futures.js';
export { ACCOUNT_ENDPOINTS } from './account.js';
export { MARGIN_ENDPOINTS, marginEndpoint } from './margin.js';
export { COPY_ENDPOINTS } from './copy-trading.js';
export { CONVERT_ENDPOINTS } from './convert.js';
export { EARN_ENDPOINTS } from './earn.js';
export type { EarnOperation } from './earn.js';
export { P2P_ENDPOINTS } from './p2p.js';
export { BROKER_ENDPOINTS } from './broker.js';
