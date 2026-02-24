"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useNetwork } from "./useNetwork";
import { fetchClearinghouseState } from "@/lib/hyperliquid";

export interface Position {
  coin: string;
  size: string;
  side: "Long" | "Short";
  entryPx: string;
  unrealizedPnl: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  positions: Position[];
}

export function useAccountState() {
  const { address } = useAccount();
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["clearinghouseState", network, address],
    queryFn: async (): Promise<AccountState> => {
      const state = await fetchClearinghouseState(network, address!);
      const positions: Position[] = state.assetPositions
        .filter((ap) => parseFloat(ap.position.szi) !== 0)
        .map((ap) => ({
          coin: ap.position.coin,
          size: Math.abs(parseFloat(ap.position.szi)).toString(),
          side: parseFloat(ap.position.szi) > 0 ? "Long" : "Short",
          entryPx: ap.position.entryPx,
          unrealizedPnl: ap.position.unrealizedPnl,
        }));

      return {
        balance: parseFloat(state.withdrawable),
        equity: parseFloat(state.crossMarginSummary.accountValue),
        positions,
      };
    },
    enabled: !!address,
    refetchInterval: network === "mainnet" ? 1_000 : 15_000,
  });
}
