"use client";

import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { useNetwork } from "./useNetwork";
import {
  createPublicClient,
  createWalletClient,
} from "@/lib/hyperliquid";

/**
 * Provides Hyperliquid clients.
 *
 * `walletClient` is wired to the user's connected wallet and should only be
 * used for **user-signed actions** (approveBuilderFee, approveAgent, etc.)
 * whose EIP-712 domain chainId matches the real chain (42161 / 421614).
 *
 * For **L1 actions** (order, cancel) whose domain chainId is 1337, use the
 * agent wallet from `useAgentWallet` instead — it signs locally and avoids
 * the wallet provider's domain-chainId validation.
 */
export function useHyperliquid() {
  const { network } = useNetwork();
  const { data: viemWalletClient } = useWalletClient();

  const publicClient = useMemo(() => createPublicClient(network), [network]);

  const walletClient = useMemo(() => {
    if (!viemWalletClient) return null;
    return createWalletClient(network, viemWalletClient);
  }, [network, viemWalletClient]);

  return { publicClient, walletClient, viemWalletClient };
}
