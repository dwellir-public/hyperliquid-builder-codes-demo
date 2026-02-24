"use client";

import { useAccount } from "wagmi";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";
import { DWELLIR_BUILDER_ADDRESS, feeToHuman } from "@/config/constants";
import StepCard from "./StepCard";

export default function ApprovalStatus() {
  const { isConnected } = useAccount();
  const { data: maxFee, isLoading, error } = useBuilderApproval();

  return (
    <StepCard
      step={1}
      title="Check Approval Status"
      description="Query whether your wallet has approved the Dwellir builder address. This is a read-only call — no signing required."
    >
      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet to check.</p>
      ) : isLoading ? (
        <p className="text-sm text-hl-muted">Querying...</p>
      ) : error ? (
        <p className="text-sm text-hl-red">
          Error: {(error as Error).message}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                maxFee && maxFee > 0 ? "bg-hl-green" : "bg-hl-red"
              }`}
            />
            <span className="text-sm font-medium">
              {maxFee && maxFee > 0 ? "Approved" : "Not approved"}
            </span>
          </div>
          {maxFee !== undefined && maxFee > 0 && (
            <p className="text-sm text-hl-muted">
              Max approved fee: {feeToHuman(maxFee)}
            </p>
          )}
          <p className="text-xs text-hl-muted font-mono break-all">
            Builder: {DWELLIR_BUILDER_ADDRESS}
          </p>
        </div>
      )}
    </StepCard>
  );
}
