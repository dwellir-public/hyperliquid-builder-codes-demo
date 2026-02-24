"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { useAllMids, useMeta } from "@/hooks/useMarketData";
import { useAccountState } from "@/hooks/useAccountState";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import {
  DWELLIR_BUILDER_ADDRESS,
  DEFAULT_BUILDER_FEE,
} from "@/config/constants";
import { useBBO } from "@/hooks/useDwellirL2Book";
import StepCard from "./StepCard";
import TransactionResult from "./TransactionResult";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

interface PlaceOrderProps {
  coin: string;
  setCoin: (coin: string) => void;
  locked?: boolean;
}

export default function PlaceOrder({ coin, setCoin, locked }: PlaceOrderProps) {
  const { isConnected } = useAccount();
  const { agentWalletClient } = useAgentWallet();
  const { data: mids } = useAllMids();
  const { data: meta } = useMeta();
  const { data: account } = useAccountState();

  const [isBuy, setIsBuy] = useState(true);
  const [size, setSize] = useState("0.01");
  const [priceOffset, setPriceOffset] = useState("5");
  const [coinSearch, setCoinSearch] = useState("");
  const { data: openOrders, isLoading: ordersLoading, cancelOrder } = useOpenOrders();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOid, setCancellingOid] = useState<number | null>(null);
  const [cancelResult, setCancelResult] = useState<unknown>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const bbo = useBBO(coin);
  const polledMid = mids?.[coin] ? parseFloat(mids[coin]) : null;
  const midPrice = bbo?.mid ?? polledMid;
  const assetIndex = meta?.universe.findIndex((a) => a.name === coin) ?? -1;
  const szDecimals = meta?.universe[assetIndex]?.szDecimals;
  const estimatedCost = midPrice ? (parseFloat(size) * midPrice).toFixed(2) : null;

  const computePrice = (): string | null => {
    if (!midPrice) return null;
    const offset = parseFloat(priceOffset) / 100;
    const price = isBuy ? midPrice * (1 - offset) : midPrice * (1 + offset);
    return parseFloat(price.toPrecision(5)).toString();
  };

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

  const handleOrder = async () => {
    if (!agentWalletClient || assetIndex < 0 || sizeError) return;
    const price = computePrice();
    if (!price) return;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await agentWalletClient.order({
        orders: [
          {
            a: assetIndex,
            b: isBuy,
            p: price,
            s: size,
            r: false,
            t: { limit: { tif: "Gtc" } },
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

  const handleCancel = async (coin: string, oid: number) => {
    setCancellingOid(oid);
    setCancelResult(null);
    setCancelError(null);
    try {
      const res = await cancelOrder(coin, oid);
      setCancelResult(res ?? { status: "ok" });
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancellingOid(null);
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
      step={4}
      title="Place Limit Order with Builder Code"
      description="Submit a GTC limit order with the Dwellir builder code attached. The order is placed safely away from mid price so it rests on the book."
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
                list="coin-list-limit"
                className="w-24 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm focus:outline-none focus:border-hl-green"
              />
              <datalist id="coin-list-limit">
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
            <div>
              <label className="text-xs text-hl-muted block mb-1">
                Offset from mid (%)
              </label>
              <input
                type="text"
                value={priceOffset}
                onChange={(e) => setPriceOffset(e.target.value)}
                className="w-16 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-hl-green"
              />
            </div>
          </div>
          {midPrice && (
            <div className="text-xs space-y-1 bg-hl-bg/50 border border-hl-border rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-hl-muted">Dwellir L2 Orderbook</span>
                <span className="text-[10px] text-hl-muted/50 font-mono">LIVE</span>
              </div>
              <div className="font-mono flex items-baseline gap-2">
                <span className="text-hl-green">{bbo ? bbo.bestBid.toFixed(2) : "—"}</span>
                <span className="text-hl-muted/40">/</span>
                <span className="text-hl-red">{bbo ? bbo.bestAsk.toFixed(2) : "—"}</span>
                <span className="text-hl-muted/50 text-[10px] ml-auto">BID / ASK</span>
              </div>
              <div className="font-mono flex items-baseline gap-2">
                <span className="text-white">${midPrice.toFixed(2)}</span>
                <span className="text-hl-muted/50 text-[10px]">MID</span>
                <span className="text-hl-muted ml-auto">
                  Limit: ${computePrice() ?? "—"}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleOrder}
            disabled={loading || assetIndex < 0 || !!sizeError}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-hl-bg hover:bg-hl-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing..." : "Place Limit Order"}
          </button>
          <TransactionResult result={result} error={error} context="order" />

          {/* Open Orders */}
          <div className="border-t border-hl-border pt-3 mt-4">
            <h4 className="text-xs font-medium text-hl-muted mb-2">
              Open Orders
            </h4>
            {ordersLoading ? (
              <p className="text-xs text-hl-muted">Loading...</p>
            ) : !openOrders || openOrders.length === 0 ? (
              <p className="text-xs text-hl-muted">No open orders.</p>
            ) : (
              <div className="border border-hl-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-hl-bg text-hl-muted text-xs">
                      <th className="text-left px-3 py-2">Coin</th>
                      <th className="text-left px-3 py-2">Side</th>
                      <th className="text-right px-3 py-2">Size</th>
                      <th className="text-right px-3 py-2">Price</th>
                      <th className="text-right px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((order) => (
                      <tr
                        key={order.oid}
                        className="border-t border-hl-border hover:bg-hl-card/50"
                      >
                        <td className="px-3 py-2 font-medium">{order.coin}</td>
                        <td
                          className={`px-3 py-2 ${
                            order.side === "B"
                              ? "text-hl-green"
                              : "text-hl-red"
                          }`}
                        >
                          {order.side === "B" ? "Buy" : "Sell"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {order.sz}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          ${parseFloat(order.limitPx).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleCancel(order.coin, order.oid)}
                            disabled={cancellingOid === order.oid}
                            className="px-2 py-1 text-xs font-medium rounded border border-hl-red/50 text-hl-red hover:bg-hl-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {cancellingOid === order.oid
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <TransactionResult result={cancelResult} error={cancelError} context="cancel" />
          </div>
        </div>
      )}
    </StepCard>
  );
}
