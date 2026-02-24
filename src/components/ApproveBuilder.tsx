"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { useNetwork } from "@/hooks/useNetwork";
import {
  DWELLIR_BUILDER_ADDRESS,
  DEFAULT_BUILDER_FEE,
  feeToPercent,
} from "@/config/constants";
import StepCard from "./StepCard";
import TransactionResult from "./TransactionResult";

export default function ApproveBuilder() {
  const { isConnected } = useAccount();
  const { walletClient } = useHyperliquid();
  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const [fee, setFee] = useState(DEFAULT_BUILDER_FEE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!walletClient) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await walletClient.approveBuilderFee({
        builder: DWELLIR_BUILDER_ADDRESS,
        maxFeeRate: feeToPercent(fee),
      });
      setResult(res);
      queryClient.invalidateQueries({
        queryKey: ["maxBuilderFee", network],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepCard
      step={2}
      title="Approve Builder Fee"
      description="Sign an EIP-712 message to approve the Dwellir builder address. This must be signed by your main wallet (not an agent wallet)."
    >
      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-hl-muted">Max fee (tenths bps):</label>
            <input
              type="number"
              min={1}
              max={100}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-20 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-hl-green"
            />
            <span className="text-xs text-hl-muted">
              = {feeToPercent(fee)}
            </span>
          </div>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-hl-bg hover:bg-hl-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Waiting for signature..." : "Approve Builder"}
          </button>
          <TransactionResult result={result} error={error} context="approve" />
        </div>
      )}
    </StepCard>
  );
}
