export const DWELLIR_BUILDER_ADDRESS =
  "0xE94D5a0a377Afe26a461e8aAC2c7189D2006c8b9" as const;

export const DEFAULT_BUILDER_FEE = 10; // 1 bps = 0.01%

export const NETWORKS = {
  testnet: {
    label: "Testnet",
    apiUrl: "https://api.hyperliquid-testnet.xyz",
    appUrl: "https://app.hyperliquid-testnet.xyz",
    isTestnet: true,
  },
  mainnet: {
    label: "Mainnet",
    apiUrl: "https://api.hyperliquid.xyz",
    appUrl: "https://app.hyperliquid.xyz",
    isTestnet: false,
  },
} as const;

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
