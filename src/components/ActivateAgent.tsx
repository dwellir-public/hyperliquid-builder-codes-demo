"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAgentWallet } from "@/hooks/useAgentWallet";

interface ActivateAgentProps {
  onComplete: () => void;
}

export default function ActivateAgent({ onComplete }: ActivateAgentProps) {
  const { isConnected } = useAccount();
  const { agentAddress, isAgentApproved, isApproving, approveAgent, deactivateAgent, error } =
    useAgentWallet();

  // Track whether the agent was already approved when this step mounted,
  // so we only auto-advance on a fresh activation — not on revisit.
  const wasApprovedOnMount = useRef(isAgentApproved);

  useEffect(() => {
    if (isAgentApproved && !wasApprovedOnMount.current) {
      onComplete();
    }
  }, [isAgentApproved, onComplete]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Activate Trading Session</h2>
        <p className="text-sm text-hl-muted mt-1">
          Authorize a temporary signing key so the app can place orders locally. This avoids the
          wallet's chain-ID restriction on Hyperliquid L1 actions.
        </p>
      </div>

      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : isAgentApproved ? (
        <div className="space-y-3">
          <p className="text-sm text-hl-green">Agent wallet active for this session</p>
          <p className="text-xs text-hl-muted font-mono break-all">Agent: {agentAddress}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 transition-colors"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={deactivateAgent}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-hl-red/50 text-hl-red hover:bg-hl-red/10 transition-colors"
            >
              Deactivate Agent
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-hl-muted">
            A temporary key will sign orders on your behalf. It is stored only in this browser tab
            and cleared when you close it.
          </p>
          {agentAddress && (
            <p className="text-xs text-hl-muted font-mono break-all">
              Agent address: {agentAddress}
            </p>
          )}
          <button
            type="button"
            onClick={() => approveAgent().catch(() => {})}
            disabled={isApproving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApproving ? "Waiting for signature..." : "Activate Agent"}
          </button>
          {error && <p className="text-sm text-hl-red break-all">{error}</p>}
        </div>
      )}
    </div>
  );
}
