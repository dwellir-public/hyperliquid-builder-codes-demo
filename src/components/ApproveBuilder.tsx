"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount } from "wagmi";
import { DEFAULT_BUILDER_FEE, DWELLIR_BUILDER_ADDRESS, feeToPercent } from "@/config/constants";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { useNetwork } from "@/hooks/useNetwork";
import TransactionResult from "./TransactionResult";

interface ApproveBuilderProps {
  onComplete: () => void;
}

export default function ApproveBuilder({ onComplete }: ApproveBuilderProps) {
  const { isConnected } = useAccount();
  const { walletClient } = useHyperliquid();
  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const { data: maxFee } = useBuilderApproval();
  const isAlreadyApproved = maxFee !== undefined && maxFee > 0;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleApprove = async () => {
    if (!walletClient) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await walletClient.approveBuilderFee({
        builder: DWELLIR_BUILDER_ADDRESS,
        maxFeeRate: feeToPercent(DEFAULT_BUILDER_FEE),
      });
      setResult(res);
      queryClient.invalidateQueries({
        queryKey: ["maxBuilderFee", network],
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Approve Builder Fee</h2>
        <p className="text-sm text-hl-muted mt-1">
          Sign an EIP-712 message to approve the Dwellir builder address. This must be signed by
          your main wallet (not an agent wallet).
        </p>
      </div>

      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : isAlreadyApproved ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hl-green" />
            <span className="text-sm font-medium">Already approved</span>
          </div>
          <p className="text-sm text-hl-muted">
            Max approved fee: {feeToPercent(DEFAULT_BUILDER_FEE)}
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-hl-muted">Builder fee:</span>
            <span className="text-sm font-mono font-medium">
              {feeToPercent(DEFAULT_BUILDER_FEE)}
            </span>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="text-hl-muted hover:text-hl-text transition-colors"
                aria-label="Fee information"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-hl-bg border border-hl-border rounded-lg p-2 text-xs text-hl-muted shadow-lg z-10">
                  The minimum fee for this builder is {feeToPercent(DEFAULT_BUILDER_FEE)} (1 bps).
                  Orders below this will be rejected.
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Waiting for signature..." : "Approve Builder"}
          </button>
          <TransactionResult result={result} error={error} context="approve" />
        </div>
      )}
    </div>
  );
}
