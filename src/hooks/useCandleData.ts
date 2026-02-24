"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNetwork } from "./useNetwork";
import { fetchCandleSnapshot } from "@/lib/hyperliquid";
import { useDwellirL2Book, type L2Update } from "./useDwellirL2Book";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Interval duration in seconds */
const INTERVAL_SECONDS: Record<string, number> = {
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

function candleBucket(timeMs: number, intervalSec: number): number {
  const timeSec = Math.floor(timeMs / 1000);
  return Math.floor(timeSec / intervalSec) * intervalSec;
}

export function useCandleData(coin: string, interval: string = "1h") {
  const { network } = useNetwork();
  const queryClient = useQueryClient();
  const queryKey = ["candleSnapshot", network, coin, interval];

  const query = useQuery({
    queryKey,
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
    staleTime: network === "mainnet" ? 30_000 : 60_000,
    refetchInterval: network === "mainnet" ? 30_000 : 60_000,
  });

  const onL2Update = useCallback(
    (update: L2Update) => {
      const intervalSec = INTERVAL_SECONDS[interval] ?? 3600;
      const price = update.mid;
      const bucket = candleBucket(update.time, intervalSec);

      queryClient.setQueryData<Candle[]>(queryKey, (prev) => {
        if (!prev || prev.length === 0) return prev;
        const candles = [...prev];
        const last = candles[candles.length - 1];

        if (last.time === bucket) {
          // Update existing candle with L2 midpoint
          candles[candles.length - 1] = {
            ...last,
            close: price,
            high: Math.max(last.high, price),
            low: Math.min(last.low, price),
          };
        } else if (bucket > last.time) {
          // New candle period
          candles.push({
            time: bucket,
            open: price,
            high: price,
            low: price,
            close: price,
          });
        }

        return candles;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, network, coin, interval]
  );

  useDwellirL2Book(coin, onL2Update);

  return query;
}
