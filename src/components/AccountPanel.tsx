"use client";

import { useState } from "react";
import { DEFAULT_BUILDER_FEE, DWELLIR_BUILDER_ADDRESS } from "@/config/constants";
import { useAccountState } from "@/hooks/useAccountState";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";
import { useAllMids, useMeta } from "@/hooks/useMarketData";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import TransactionResult from "./TransactionResult";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-hl-border/50 rounded ${className}`} />;
}

export default function AccountPanel() {
  const { data: account, isLoading: accountLoading } = useAccountState();
  const { data: orders, isLoading: ordersLoading, cancelOrder } = useOpenOrders();
  const { data: maxFee } = useBuilderApproval();
  const { agentWalletClient } = useAgentWallet();
  const { data: mids } = useAllMids();
  const { data: meta } = useMeta();
  const [cancellingOid, setCancellingOid] = useState<number | null>(null);
  const [closingCoin, setClosingCoin] = useState<string | null>(null);
  const [closeResult, setCloseResult] = useState<unknown>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const SLIPPAGE = 0.03;

  const handleCancel = async (coin: string, oid: number) => {
    setCancellingOid(oid);
    try {
      await cancelOrder(coin, oid);
    } catch {
      // Error handling via UI feedback
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

  const isApproved = maxFee != null && maxFee > 0;

  return (
    <div className="bg-hl-card border border-hl-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Account Overview</h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isApproved ? "bg-hl-green/15 text-hl-green" : "bg-hl-red/15 text-hl-red"
          }`}
        >
          {isApproved ? "Builder Approved" : "Not Approved"}
        </span>
      </div>

      {/* Balance row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-hl-muted">USDC Balance</p>
          {accountLoading ? (
            <Skeleton className="h-5 w-20 mt-1" />
          ) : (
            <p className="text-base font-mono font-medium">
              ${account?.balance.toFixed(2) ?? "0.00"}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-hl-muted">Account Equity</p>
          {accountLoading ? (
            <Skeleton className="h-5 w-20 mt-1" />
          ) : (
            <p className="text-base font-mono font-medium">
              ${account?.equity.toFixed(2) ?? "0.00"}
            </p>
          )}
        </div>
      </div>

      {/* Positions */}
      {account && account.positions.length > 0 && (
        <div>
          <p className="text-xs text-hl-muted mb-2">Open Positions</p>
          <div className="border border-hl-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-hl-bg text-hl-muted">
                  <th className="text-left px-2 py-1.5">Coin</th>
                  <th className="text-left px-2 py-1.5">Side</th>
                  <th className="text-right px-2 py-1.5">Size</th>
                  <th className="text-right px-2 py-1.5">Entry</th>
                  <th className="text-right px-2 py-1.5">PnL</th>
                  <th className="text-right px-2 py-1.5">{""}</th>
                </tr>
              </thead>
              <tbody>
                {account.positions.map((pos) => {
                  const pnl = Number.parseFloat(pos.unrealizedPnl);
                  return (
                    <tr key={pos.coin} className="border-t border-hl-border">
                      <td className="px-2 py-1.5 font-medium font-mono">{pos.coin}</td>
                      <td
                        className={`px-2 py-1.5 ${pos.side === "Long" ? "text-hl-green" : "text-hl-red"}`}
                      >
                        {pos.side}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{pos.size}</td>
                      <td className="px-2 py-1.5 text-right font-mono">
                        $
                        {Number.parseFloat(pos.entryPx).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono ${pnl >= 0 ? "text-hl-green" : "text-hl-red"}`}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {pnl.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleClosePosition(pos.coin, pos.size, pos.side)}
                          disabled={closingCoin === pos.coin || !agentWalletClient}
                          className="px-1.5 py-0.5 text-xs font-medium rounded border border-hl-red/50 text-hl-red hover:bg-hl-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {closingCoin === pos.coin ? "..." : "Close"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TransactionResult result={closeResult} error={closeError} context="order" />
        </div>
      )}

      {/* Open Orders */}
      {!ordersLoading && orders && orders.length > 0 && (
        <div>
          <p className="text-xs text-hl-muted mb-2">Open Orders</p>
          <div className="space-y-1">
            {orders.map((order) => (
              <div
                key={order.oid}
                className="flex items-center justify-between text-xs font-mono bg-hl-bg rounded px-3 py-1.5"
              >
                <span className="font-medium">{order.coin}</span>
                <span className={order.side === "B" ? "text-hl-green" : "text-hl-red"}>
                  {order.side === "B" ? "Buy" : "Sell"}
                </span>
                <span>{order.sz}</span>
                <span className="text-hl-muted">@{parseFloat(order.limitPx).toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => handleCancel(order.coin, order.oid)}
                  disabled={cancellingOid === order.oid}
                  className="text-hl-red hover:text-hl-red/80 disabled:opacity-50"
                >
                  {cancellingOid === order.oid ? "..." : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
