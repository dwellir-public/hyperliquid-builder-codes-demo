"use client";

import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";
import { fetchCandleSnapshot } from "@/lib/hyperliquid";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function useCandleData(coin: string, interval: string = "1h") {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["candleSnapshot", network, coin, interval],
    queryFn: async (): Promise<Candle[]> => {
      const startTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const raw = await fetchCandleSnapshot(network, coin, interval, startTime);
      return raw.map((c) => ({
        time: Math.floor(c.t / 1000),
        open: parseFloat(c.o),
        high: parseFloat(c.h),
        low: parseFloat(c.l),
        close: parseFloat(c.c),
      }));
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
