"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { useNetwork } from "@/hooks/useNetwork";
import { DWELLIR_BUILDER_ADDRESS } from "@/config/constants";
import StepCard from "./StepCard";
import TransactionResult from "./TransactionResult";

export default function RevokeApproval({ locked }: { locked?: boolean }) {
  const { isConnected } = useAccount();
  const { walletClient } = useHyperliquid();
  const { network } = useNetwork();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async () => {
    if (!walletClient) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await walletClient.approveBuilderFee({
        builder: DWELLIR_BUILDER_ADDRESS,
        maxFeeRate: "0%",
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
      step={6}
      title="Revoke Approval"
      description="Revoke the builder's permission by setting the max fee to 0%. After this, orders with this builder code will be rejected."
      locked={locked}
    >
      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-hl-red/50 text-hl-red hover:bg-hl-red/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Waiting for signature..." : "Revoke Builder Approval"}
          </button>
          <TransactionResult result={result} error={error} context="revoke" />
        </div>
      )}
    </StepCard>
  );
}
