"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { useAllMids, useMeta } from "@/hooks/useMarketData";
import { useAccountState } from "@/hooks/useAccountState";
import {
  DWELLIR_BUILDER_ADDRESS,
  DEFAULT_BUILDER_FEE,
} from "@/config/constants";
import StepCard from "./StepCard";
import TransactionResult from "./TransactionResult";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

const SLIPPAGE = 0.03;

interface MarketOrderProps {
  coin: string;
  setCoin: (coin: string) => void;
  locked?: boolean;
}

export default function MarketOrder({ coin, setCoin, locked }: MarketOrderProps) {
  const { isConnected } = useAccount();
  const { agentWalletClient } = useAgentWallet();
  const { data: mids } = useAllMids();
  const { data: meta } = useMeta();
  const { data: account } = useAccountState();

  const [isBuy, setIsBuy] = useState(true);
  const [size, setSize] = useState("0.01");
  const [coinSearch, setCoinSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const midPrice = mids?.[coin] ? parseFloat(mids[coin]) : null;
  const assetIndex = meta?.universe.findIndex((a) => a.name === coin) ?? -1;
  const szDecimals = meta?.universe[assetIndex]?.szDecimals;
  const iocPrice = midPrice
    ? isBuy
      ? midPrice * (1 + SLIPPAGE)
      : midPrice * (1 - SLIPPAGE)
    : null;
  const estimatedCost = midPrice
    ? (parseFloat(size) * midPrice).toFixed(2)
    : null;

  const validateSize = (): string | null => {
    const s = parseFloat(size);
    if (isNaN(s) || s <= 0) return "Size must be positive";
    if (szDecimals !== undefined) {
      const parts = size.split(".");
      if (parts[1] && parts[1].length > szDecimals) {
        return `Max ${szDecimals} decimal places for ${coin}`;
      }
    }
    return null;
  };

  const sizeError = validateSize();

  const handleMarketOrder = async () => {
    if (!agentWalletClient || !midPrice || assetIndex < 0 || !iocPrice) return;

    setLoading(true);
    setConfirming(false);
    setResult(null);
    setError(null);
    try {
      const res = await agentWalletClient.order({
        orders: [
          {
            a: assetIndex,
            b: isBuy,
            p: parseFloat(iocPrice.toPrecision(5)).toString(),
            s: size,
            r: false,
            t: { limit: { tif: "Ioc" } },
          },
        ],
        grouping: "na",
        builder: {
          b: DWELLIR_BUILDER_ADDRESS,
          f: DEFAULT_BUILDER_FEE,
        },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const allCoins = meta?.universe.map((a) => a.name) ?? [];
  const filteredCoins = coinSearch
    ? allCoins.filter((c) =>
        c.toLowerCase().includes(coinSearch.toLowerCase())
      )
    : allCoins;

  return (
    <StepCard
      step={5}
      title="Market Order with Builder Code"
      description="Submit an IOC (immediate-or-cancel) limit order at mid price with 3% slippage — effectively a market order. Uses the Dwellir builder code."
      locked={locked}
    >
      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : (
        <div className="space-y-3">
          <PriceChart coin={coin} />

          {account && (
            <p className="text-xs text-hl-muted">
              Balance: ${account.balance.toFixed(2)} USDC
              {estimatedCost && (
                <> | Est. cost: ${estimatedCost}</>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <label className="text-xs text-hl-muted block mb-1">Coin</label>
              <input
                type="text"
                value={coinSearch || coin}
                onChange={(e) => {
                  setCoinSearch(e.target.value);
                  const match = allCoins.find(
                    (c) => c.toLowerCase() === e.target.value.toLowerCase()
                  );
                  if (match) {
                    setCoin(match);
                    setCoinSearch("");
                  }
                }}
                onFocus={() => setCoinSearch("")}
                onBlur={() => setTimeout(() => setCoinSearch(""), 150)}
                list="coin-list-market"
                className="w-24 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm focus:outline-none focus:border-hl-green"
              />
              <datalist id="coin-list-market">
                {filteredCoins.slice(0, 50).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-hl-muted block mb-1">Side</label>
              <select
                value={isBuy ? "buy" : "sell"}
                onChange={(e) => setIsBuy(e.target.value === "buy")}
                className="bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm focus:outline-none focus:border-hl-green"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-hl-muted block mb-1">Size</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={`w-24 bg-hl-bg border rounded px-2 py-1 text-sm font-mono focus:outline-none ${
                  sizeError
                    ? "border-hl-red focus:border-hl-red"
                    : "border-hl-border focus:border-hl-green"
                }`}
              />
              {sizeError && (
                <p className="text-xs text-hl-red mt-0.5">{sizeError}</p>
              )}
            </div>
          </div>

          {midPrice && (
            <p className="text-xs text-hl-muted">
              Mid: ${midPrice.toFixed(2)} | IOC limit:{" "}
              ${iocPrice ? parseFloat(iocPrice.toPrecision(5)) : "—"} (3% slippage)
            </p>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={loading || assetIndex < 0 || !!sizeError}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-red/80 text-white hover:bg-hl-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Place Market Order
            </button>
          ) : (
            <div className="bg-hl-red/5 border border-hl-red/30 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-white">
                Confirm Market Order
              </p>
              <p className="text-xs text-hl-muted">
                {isBuy ? "Buy" : "Sell"} {size} {coin} at ~$
                {iocPrice?.toPrecision(6)} (IOC)
                {estimatedCost && <> — est. ${estimatedCost} USDC</>}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleMarketOrder}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-hl-red text-white hover:bg-hl-red/80 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Signing..." : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-hl-border text-hl-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-hl-muted">
            Warning: This will execute immediately if there is sufficient
            liquidity. Use on testnet first.
          </p>
          <TransactionResult result={result} error={error} context="order" />
        </div>
      )}
    </StepCard>
  );
}
