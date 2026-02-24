export const DWELLIR_BUILDER_ADDRESS =
  (process.env.NEXT_PUBLIC_BUILDER_ADDRESS ??
    "0xE94D5a0a377Afe26a461e8aAC2c7189D2006c8b9") as `0x${string}`;

export const DEFAULT_BUILDER_FEE = Number(
  process.env.NEXT_PUBLIC_BUILDER_FEE ?? 10
); // default: 1 bps = 0.01%

const DWELLIR_API_KEY = process.env.NEXT_PUBLIC_DWELLIR_API_KEY;

export const NETWORKS = {
  testnet: {
    label: "Testnet",
    apiUrl: "https://api.hyperliquid-testnet.xyz",
    infoUrl: "https://api.hyperliquid-testnet.xyz/info",
    publicInfoUrl: "https://api.hyperliquid-testnet.xyz/info",
    wsUrl: "wss://api.hyperliquid-testnet.xyz/ws",
    appUrl: "https://app.hyperliquid-testnet.xyz",
    isTestnet: true,
  },
  mainnet: {
    label: "Mainnet",
    apiUrl: "https://api.hyperliquid.xyz",
    infoUrl: DWELLIR_API_KEY
      ? `https://api-hyperliquid-mainnet-info.n.dwellir.com/${DWELLIR_API_KEY}/info`
      : "https://api.hyperliquid.xyz/info",
    publicInfoUrl: "https://api.hyperliquid.xyz/info",
    wsUrl: DWELLIR_API_KEY
      ? `wss://api-hyperliquid-mainnet-orderbook.n.dwellir.com/${DWELLIR_API_KEY}/ws`
      : "wss://api.hyperliquid.xyz/ws",
    appUrl: "https://app.hyperliquid.xyz",
    isTestnet: false,
  },
};

export type NetworkKey = keyof typeof NETWORKS;

/** Convert fee in tenths-of-a-basis-point to a human-readable string. */
export function feeToHuman(f: number): string {
  const bps = f / 10;
  const pct = f / 1000;
  return `${f} (${bps} bps = ${pct.toFixed(4)}%)`;
}

/** Convert fee in tenths-of-a-basis-point to a percentage string for the SDK. */
export function feeToPercent(f: number): `${string}%` {
  const pct = f / 1000;
  return `${pct.toFixed(4)}%`;
}
