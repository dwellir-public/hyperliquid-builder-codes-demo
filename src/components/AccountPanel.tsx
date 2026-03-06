"use client";

import { useState } from "react";
import { useAccountState } from "@/hooks/useAccountState";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";
import { useOpenOrders } from "@/hooks/useOpenOrders";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-hl-border/50 rounded ${className}`} />;
}

export default function AccountPanel() {
  const { data: account, isLoading: accountLoading } = useAccountState();
  const { data: orders, isLoading: ordersLoading, cancelOrder } = useOpenOrders();
  const { data: maxFee } = useBuilderApproval();
  const [cancellingOid, setCancellingOid] = useState<number | null>(null);

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
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs text-hl-muted">Open Positions</p>
            <span className="group relative">
              <svg
                className="w-3.5 h-3.5 text-hl-muted/50 cursor-help"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 px-2.5 py-1.5 text-xs text-white bg-hl-bg border border-hl-border rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                These are perpetual futures positions created by filled orders. To close a position,
                place an opposite order (e.g. sell to close a long) on the Place Order step.
              </span>
            </span>
          </div>
          <div className="space-y-1">
            {account.positions.map((pos) => {
              const pnl = parseFloat(pos.unrealizedPnl);
              return (
                <div
                  key={pos.coin}
                  className="flex items-center justify-between text-xs font-mono bg-hl-bg rounded px-3 py-1.5"
                >
                  <span className="font-medium">{pos.coin}</span>
                  <span className={pos.side === "Long" ? "text-hl-green" : "text-hl-red"}>
                    {pos.side}
                  </span>
                  <span>{pos.size}</span>
                  <span className="text-hl-muted">@{parseFloat(pos.entryPx).toFixed(2)}</span>
                  <span className={pnl >= 0 ? "text-hl-green" : "text-hl-red"}>
                    {pnl >= 0 ? "+" : ""}
                    {pnl.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
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
