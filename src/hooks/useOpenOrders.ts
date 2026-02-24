"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useNetwork } from "./useNetwork";
import { useAgentWallet } from "./useAgentWallet";
import { useMeta } from "./useMarketData";
import { fetchOpenOrders } from "@/lib/hyperliquid";
import { useCallback } from "react";

export interface OpenOrder {
  coin: string;
  oid: number;
  side: string;
  sz: string;
  limitPx: string;
  timestamp: number;
}

export function useOpenOrders() {
  const { address } = useAccount();
  const { network } = useNetwork();
  const { agentWalletClient } = useAgentWallet();
  const { data: meta } = useMeta();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["openOrders", network, address],
    queryFn: () => fetchOpenOrders(network, address!),
    enabled: !!address,
    refetchInterval: network === "mainnet" ? 3_000 : 10_000,
  });

  const cancelOrder = useCallback(
    async (coin: string, oid: number) => {
      if (!agentWalletClient) throw new Error("Agent not active");
      const assetIndex = meta?.universe.findIndex((a) => a.name === coin) ?? -1;
      if (assetIndex < 0) throw new Error(`Unknown asset: ${coin}`);
      await agentWalletClient.cancel({
        cancels: [{ a: assetIndex, o: oid }],
      });
      queryClient.invalidateQueries({
        queryKey: ["openOrders", network, address],
      });
    },
    [agentWalletClient, meta, queryClient, network, address]
  );

  return { ...query, cancelOrder };
}
