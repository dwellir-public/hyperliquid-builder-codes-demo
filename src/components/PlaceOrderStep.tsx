"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useAccount } from "wagmi";
import { DEFAULT_BUILDER_FEE, DWELLIR_BUILDER_ADDRESS } from "@/config/constants";
import { useAccountState } from "@/hooks/useAccountState";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { useBBO } from "@/hooks/useDwellirL2Book";
import { useAllMids, useMeta } from "@/hooks/useMarketData";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import TransactionResult from "./TransactionResult";

const PriceChart = dynamic(() => import("./PriceChart"), { ssr: false });

const SLIPPAGE = 0.03;

interface PlaceOrderStepProps {
  onComplete: () => void;
}

export default function PlaceOrderStep({ onComplete }: PlaceOrderStepProps) {
  const { isConnected } = useAccount();
  const { agentWalletClient } = useAgentWallet();
  const { data: mids } = useAllMids();
  const { data: meta } = useMeta();
  const { data: account } = useAccountState();

  const [tab, setTab] = useState<"market" | "limit">("market");
  const [coin, setCoin] = useState("ETH");
  const [isBuy, setIsBuy] = useState(true);
  const [size, setSize] = useState("0.01");
  const [priceOffset, setPriceOffset] = useState("5");
  const [coinSearch, setCoinSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const [cancellingOid, setCancellingOid] = useState<number | null>(null);
  const [cancelResult, setCancelResult] = useState<unknown>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [closingCoin, setClosingCoin] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState<unknown>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const { data: openOrders, isLoading: ordersLoading, cancelOrder } = useOpenOrders();

  const bbo = useBBO(coin);
  const polledMid = mids?.[coin] ? Number.parseFloat(mids[coin]) : null;
  const midPrice = bbo?.mid ?? polledMid;
  const assetIndex = meta?.universe.findIndex((a) => a.name === coin) ?? -1;
  const szDecimals = meta?.universe[assetIndex]?.szDecimals;
  const estimatedCost = midPrice ? (Number.parseFloat(size) * midPrice).toFixed(2) : null;

  const iocPrice = midPrice
    ? isBuy
      ? midPrice * (1 + SLIPPAGE)
      : midPrice * (1 - SLIPPAGE)
    : null;

  const computeLimitPrice = (): string | null => {
    if (!midPrice) return null;
    const offset = Number.parseFloat(priceOffset) / 100;
    const price = isBuy ? midPrice * (1 - offset) : midPrice * (1 + offset);
    return Number.parseFloat(price.toPrecision(5)).toString();
  };

  const validateSize = (): string | null => {
    const s = Number.parseFloat(size);
    if (Number.isNaN(s) || s <= 0) return "Size must be positive";
    if (szDecimals !== undefined) {
      const parts = size.split(".");
      if (parts[1] && parts[1].length > szDecimals) {
        return `Max ${szDecimals} decimal places for ${coin}`;
      }
    }
    return null;
  };

  const sizeError = validateSize();

  const handleLimitOrder = async () => {
    if (!agentWalletClient || assetIndex < 0 || sizeError) return;
    const price = computeLimitPrice();
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
        builder: { b: DWELLIR_BUILDER_ADDRESS, f: DEFAULT_BUILDER_FEE },
      });
      setResult(res);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

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
            p: Number.parseFloat(iocPrice.toPrecision(5)).toString(),
            s: size,
            r: false,
            t: { limit: { tif: "Ioc" } },
          },
        ],
        grouping: "na",
        builder: { b: DWELLIR_BUILDER_ADDRESS, f: DEFAULT_BUILDER_FEE },
      });
      setResult(res);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderCoin: string, oid: number) => {
    setCancellingOid(oid);
    setCancelResult(null);
    setCancelError(null);
    try {
      const res = await cancelOrder(orderCoin, oid);
      setCancelResult(res ?? { status: "ok" });
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancellingOid(null);
    }
  };

  const handleClosePosition = async (posCoin: string, posSize: string, side: "Long" | "Short") => {
    if (!agentWalletClient || !mids?.[posCoin]) return;
    const posAssetIndex = meta?.universe.findIndex((a) => a.name === posCoin) ?? -1;
    if (posAssetIndex < 0) return;

    const posMid = Number.parseFloat(mids[posCoin]);
    const closeBuy = side === "Short";
    const closePrice = closeBuy ? posMid * (1 + SLIPPAGE) : posMid * (1 - SLIPPAGE);

    setClosingCoin(posCoin);
    setCloseResult(null);
    setCloseError(null);
    try {
      const res = await agentWalletClient.order({
        orders: [
          {
            a: posAssetIndex,
            b: closeBuy,
            p: Number.parseFloat(closePrice.toPrecision(5)).toString(),
            s: posSize,
            r: true,
            t: { limit: { tif: "Ioc" } },
          },
        ],
        grouping: "na",
        builder: { b: DWELLIR_BUILDER_ADDRESS, f: DEFAULT_BUILDER_FEE },
      });
      setCloseResult(res);
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : String(err));
    } finally {
      setClosingCoin(null);
    }
  };

  const allCoins = meta?.universe.map((a) => a.name) ?? [];
  const filteredCoins = coinSearch
    ? allCoins.filter((c) => c.toLowerCase().includes(coinSearch.toLowerCase()))
    : allCoins;

  if (!isConnected) {
    return <p className="text-sm text-hl-muted">Connect your wallet first.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Place Order</h2>
        <p className="text-sm text-hl-muted mt-1">
          Submit an order with the Dwellir builder code attached.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="inline-flex rounded-lg bg-hl-bg border border-hl-border p-0.5">
        <button
          type="button"
          onClick={() => {
            setTab("market");
            setConfirming(false);
          }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "market" ? "bg-hl-green text-white" : "text-hl-muted hover:text-white"
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("limit");
            setConfirming(false);
          }}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "limit" ? "bg-hl-green text-white" : "text-hl-muted hover:text-white"
          }`}
        >
          Limit
        </button>
      </div>

      {tab === "limit" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          <p className="text-xs text-yellow-400">
            Limit orders may not fill immediately. Market order is recommended for testing.
          </p>
        </div>
      )}

      <PriceChart coin={coin} />

      {account && (
        <p className="text-xs text-hl-muted">
          Balance: ${account.balance.toFixed(2)} USDC
          {estimatedCost && <> | Est. cost: ${estimatedCost}</>}
        </p>
      )}

      {/* Shared controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <label htmlFor="order-coin" className="text-xs text-hl-muted block mb-1">
            Coin
          </label>
          <input
            id="order-coin"
            type="text"
            value={coinSearch || coin}
            onChange={(e) => {
              setCoinSearch(e.target.value);
              const match = allCoins.find((c) => c.toLowerCase() === e.target.value.toLowerCase());
              if (match) {
                setCoin(match);
                setCoinSearch("");
              }
            }}
            onFocus={() => setCoinSearch("")}
            onBlur={() => setTimeout(() => setCoinSearch(""), 150)}
            list="coin-list-order"
            className="w-24 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm focus:outline-none focus:border-hl-green"
          />
          <datalist id="coin-list-order">
            {filteredCoins.slice(0, 50).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="order-side" className="text-xs text-hl-muted block mb-1">
            Side
          </label>
          <select
            id="order-side"
            value={isBuy ? "buy" : "sell"}
            onChange={(e) => setIsBuy(e.target.value === "buy")}
            className="bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm focus:outline-none focus:border-hl-green"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div>
          <label htmlFor="order-size" className="text-xs text-hl-muted block mb-1">
            Size
          </label>
          <input
            id="order-size"
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={`w-24 bg-hl-bg border rounded px-2 py-1 text-sm font-mono focus:outline-none ${
              sizeError
                ? "border-hl-red focus:border-hl-red"
                : "border-hl-border focus:border-hl-green"
            }`}
          />
          {sizeError && <p className="text-xs text-hl-red mt-0.5">{sizeError}</p>}
        </div>
        {tab === "limit" && (
          <div>
            <label htmlFor="order-offset" className="text-xs text-hl-muted block mb-1">
              Offset from mid (%)
            </label>
            <input
              id="order-offset"
              type="text"
              value={priceOffset}
              onChange={(e) => setPriceOffset(e.target.value)}
              className="w-16 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-hl-green"
            />
          </div>
        )}
      </div>

      {/* BBO display */}
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
              {tab === "limit"
                ? `Limit: $${computeLimitPrice() ?? "—"}`
                : `IOC: $${iocPrice ? Number.parseFloat(iocPrice.toPrecision(5)) : "—"} (3% slippage)`}
            </span>
          </div>
        </div>
      )}

      {/* Order button */}
      {tab === "limit" ? (
        <button
          type="button"
          onClick={handleLimitOrder}
          disabled={loading || assetIndex < 0 || !!sizeError}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Signing..." : "Place Limit Order"}
        </button>
      ) : !confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={loading || assetIndex < 0 || !!sizeError}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-red/80 text-white hover:bg-hl-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Place Market Order
        </button>
      ) : (
        <div className="bg-hl-red/5 border border-hl-red/30 rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium text-white">Confirm Market Order</p>
          <p className="text-xs text-hl-muted">
            {isBuy ? "Buy" : "Sell"} {size} {coin} at ~$
            {iocPrice?.toPrecision(6)} (IOC)
            {estimatedCost && <> — est. ${estimatedCost} USDC</>}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleMarketOrder}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-hl-red text-white hover:bg-hl-red/80 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-hl-border text-hl-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tab === "market" && (
        <p className="text-xs text-hl-muted">
          Warning: This will execute immediately if there is sufficient liquidity. Real funds will
          be used.
        </p>
      )}

      <TransactionResult result={result} error={error} context="order" />

      {/* Positions */}
      <div className="border-t border-hl-border pt-3 mt-4">
        <h4 className="text-xs font-medium text-hl-muted mb-2">Positions</h4>
        {!account ? (
          <p className="text-xs text-hl-muted">Loading...</p>
        ) : account.positions.length === 0 ? (
          <p className="text-xs text-hl-muted">No open positions.</p>
        ) : (
          <div className="border border-hl-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-hl-bg text-hl-muted text-xs">
                  <th className="text-left px-3 py-2">Coin</th>
                  <th className="text-left px-3 py-2">Side</th>
                  <th className="text-right px-3 py-2">Size</th>
                  <th className="text-right px-3 py-2">Entry</th>
                  <th className="text-right px-3 py-2">PnL</th>
                  <th className="text-right px-3 py-2">{""}</th>
                </tr>
              </thead>
              <tbody>
                {account.positions.map((pos) => {
                  const pnl = Number.parseFloat(pos.unrealizedPnl);
                  return (
                    <tr key={pos.coin} className="border-t border-hl-border hover:bg-hl-card/50">
                      <td className="px-3 py-2 font-medium">{pos.coin}</td>
                      <td
                        className={`px-3 py-2 ${pos.side === "Long" ? "text-hl-green" : "text-hl-red"}`}
                      >
                        {pos.side}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{pos.size}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        $
                        {Number.parseFloat(pos.entryPx).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${pnl >= 0 ? "text-hl-green" : "text-hl-red"}`}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {pnl.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleClosePosition(pos.coin, pos.size, pos.side)}
                          disabled={closingCoin === pos.coin}
                          className="px-2 py-1 text-xs font-medium rounded border border-hl-red/50 text-hl-red hover:bg-hl-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {closingCoin === pos.coin ? "Closing..." : "Close"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <TransactionResult result={closeResult} error={closeError} context="order" />
      </div>

      {/* Open Orders */}
      <div className="border-t border-hl-border pt-3 mt-4">
        <h4 className="text-xs font-medium text-hl-muted mb-2">Open Orders</h4>
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
                  <th className="text-right px-3 py-2">{""}</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((order) => (
                  <tr key={order.oid} className="border-t border-hl-border hover:bg-hl-card/50">
                    <td className="px-3 py-2 font-medium">{order.coin}</td>
                    <td
                      className={`px-3 py-2 ${order.side === "B" ? "text-hl-green" : "text-hl-red"}`}
                    >
                      {order.side === "B" ? "Buy" : "Sell"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{order.sz}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${Number.parseFloat(order.limitPx).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleCancel(order.coin, order.oid)}
                        disabled={cancellingOid === order.oid}
                        className="px-2 py-1 text-xs font-medium rounded border border-hl-red/50 text-hl-red hover:bg-hl-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {cancellingOid === order.oid ? "Cancelling..." : "Cancel"}
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
  );
}
