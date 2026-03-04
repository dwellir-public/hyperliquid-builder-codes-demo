"use client";

import { useAccount } from "wagmi";
import { DWELLIR_BUILDER_ADDRESS, feeToHuman } from "@/config/constants";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";

interface ApprovalStatusProps {
  onComplete: () => void;
}

export default function ApprovalStatus({ onComplete }: ApprovalStatusProps) {
  const { isConnected } = useAccount();
  const { data: maxFee, isLoading, error } = useBuilderApproval();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Check Approval Status</h2>
        <p className="text-sm text-hl-muted mt-1">
          Query whether your wallet has approved the Dwellir builder address. This is a read-only
          call — no signing required.
        </p>
      </div>

      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet to check.</p>
      ) : isLoading ? (
        <p className="text-sm text-hl-muted">Querying...</p>
      ) : error ? (
        <p className="text-sm text-hl-red">Error: {(error as Error).message}</p>
      ) : (
        <div className="space-y-3">
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
            <p className="text-sm text-hl-muted">Max approved fee: {feeToHuman(maxFee)}</p>
          )}
          <p className="text-xs text-hl-muted font-mono break-all">
            Builder: {DWELLIR_BUILDER_ADDRESS}
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
