import {
  PublicClient,
  WalletClient as HLWalletClient,
  HttpTransport,
} from "@nktkas/hyperliquid";
import type { WalletClient } from "viem";
import type { NetworkKey } from "@/config/constants";
import { NETWORKS } from "@/config/constants";

const TRANSPORT_URLS: Record<NetworkKey, string> = {
  testnet: "https://hyperliquid-testnet.xyz",
  mainnet: "https://hyperliquid.xyz",
};

/** Create a PublicClient (read-only) for the given network. */
export function createPublicClient(network: NetworkKey): PublicClient {
  const transport = new HttpTransport({ url: TRANSPORT_URLS[network] });
  return new PublicClient({ transport });
}

/** Create a WalletClient (signing) wired to a viem WalletClient. */
export function createWalletClient(
  network: NetworkKey,
  wallet: WalletClient
): HLWalletClient {
  const transport = new HttpTransport({ url: TRANSPORT_URLS[network] });
  const isTestnet = NETWORKS[network].isTestnet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new HLWalletClient({ transport, wallet: wallet as any, isTestnet });
}

/**
 * Create a WalletClient backed by a local viem Account (e.g. from
 * privateKeyToAccount). Signs L1 actions entirely in-memory, bypassing the
 * wallet provider's domain-chainId validation that rejects chainId 1337.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAgentWalletClient(network: NetworkKey, account: any): HLWalletClient {
  const transport = new HttpTransport({ url: TRANSPORT_URLS[network] });
  const isTestnet = NETWORKS[network].isTestnet;
  return new HLWalletClient({ transport, wallet: account, isTestnet });
}

/** Query maxBuilderFee via raw fetch (reliable regardless of SDK version). */
export async function queryMaxBuilderFee(
  network: NetworkKey,
  user: string,
  builder: string
): Promise<number> {
  const { infoUrl } = NETWORKS[network];
  const resp = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "maxBuilderFee",
      user,
      builder,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch all mid prices (uses public HL API — not available on Dwellir info). */
export async function fetchAllMids(
  network: NetworkKey
): Promise<Record<string, string>> {
  const { publicInfoUrl } = NETWORKS[network];
  const resp = await fetch(publicInfoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch perps metadata to get asset indices. */
export async function fetchMeta(
  network: NetworkKey
): Promise<{ universe: Array<{ name: string; szDecimals: number }> }> {
  const { infoUrl } = NETWORKS[network];
  const resp = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "meta" }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch clearinghouse state for a user (balance, equity, positions). */
export async function fetchClearinghouseState(
  network: NetworkKey,
  user: string
): Promise<{
  withdrawable: string;
  crossMarginSummary: { accountValue: string };
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      unrealizedPnl: string;
    };
  }>;
}> {
  const { infoUrl } = NETWORKS[network];
  const resp = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "clearinghouseState", user }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch open orders for a user. */
export async function fetchOpenOrders(
  network: NetworkKey,
  user: string
): Promise<
  Array<{
    coin: string;
    oid: number;
    side: string;
    sz: string;
    limitPx: string;
    timestamp: number;
  }>
> {
  const { infoUrl } = NETWORKS[network];
  const resp = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "openOrders", user }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch user fills (trade history — uses public HL API). */
export async function fetchUserFills(
  network: NetworkKey,
  user: string
): Promise<
  Array<{
    coin: string;
    px: string;
    sz: string;
    side: string;
    time: number;
  }>
> {
  const { publicInfoUrl } = NETWORKS[network];
  const resp = await fetch(publicInfoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "userFills", user }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch referral/builder data for a user (uses public HL API — not available on Dwellir info). */
export async function fetchReferral(
  network: NetworkKey,
  user: string
): Promise<{
  cumVlm: string;
  unclaimedRewards: string;
  claimedRewards: string;
  builderRewards: string;
}> {
  const { publicInfoUrl } = NETWORKS[network];
  const resp = await fetch(publicInfoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "referral", user }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Fetch candle snapshot for charting (uses public HL API — not available on Dwellir info). */
export async function fetchCandleSnapshot(
  network: NetworkKey,
  coin: string,
  interval: string,
  startTime: number
): Promise<
  Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>
> {
  const { publicInfoUrl } = NETWORKS[network];
  const resp = await fetch(publicInfoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin, interval, startTime },
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}
