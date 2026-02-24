"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useNetwork } from "./useNetwork";
import { NETWORKS } from "@/config/constants";

export interface L2Update {
  coin: string;
  mid: number;
  bestBid: number;
  bestAsk: number;
  time: number;
}

/**
 * Opens a WebSocket to the Dwellir orderbook L2 stream,
 * subscribes to the book for a given coin (1 level only),
 * and calls `onUpdate` with the midpoint computed from best bid/ask.
 * Reconnects with exponential backoff on disconnect.
 */
export function useDwellirL2Book(
  coin: string,
  onUpdate: (update: L2Update) => void
) {
  const { network } = useNetwork();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const latestRef = useRef<L2Update | null>(null);

  const connect = useCallback(() => {
    const wsUrl = NETWORKS[network].wsUrl;
    let retryDelay = 1000;
    let ws: WebSocket | null = null;
    let closed = false;

    function open() {
      if (closed) return;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        retryDelay = 1000;
        ws?.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "l2Book", coin, nSigFigs: 5 },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.channel === "l2Book" && msg.data) {
            const { levels, time } = msg.data;
            // levels[0] = bids (descending), levels[1] = asks (ascending)
            // We only use the top-of-book (first level)
            const bids = levels?.[0];
            const asks = levels?.[1];
            if (!bids?.length || !asks?.length) return;

            const bestBid = parseFloat(bids[0].px);
            const bestAsk = parseFloat(asks[0].px);
            const mid = (bestBid + bestAsk) / 2;

            const update: L2Update = {
              coin,
              mid,
              bestBid,
              bestAsk,
              time: time ?? Date.now(),
            };
            latestRef.current = update;
            onUpdateRef.current(update);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (closed) return;
        setTimeout(open, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30_000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    open();

    return () => {
      closed = true;
      ws?.close();
    };
  }, [network, coin]);

  useEffect(() => {
    return connect();
  }, [connect]);

  return latestRef;
}

/**
 * Reactive hook that returns the current best bid/ask/mid from the
 * Dwellir L2 book stream. Throttled to ~10 updates/s to avoid
 * excessive re-renders.
 */
export function useBBO(coin: string) {
  const [bbo, setBBO] = useState<L2Update | null>(null);
  const lastUpdateRef = useRef(0);

  const onUpdate = useCallback((update: L2Update) => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= 100) {
      lastUpdateRef.current = now;
      setBBO(update);
    }
  }, []);

  useDwellirL2Book(coin, onUpdate);

  return bbo;
}
