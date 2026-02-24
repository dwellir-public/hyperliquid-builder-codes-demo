"use client";

import { useAccount } from "wagmi";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import StepCard from "./StepCard";

interface ActivateAgentProps {
  locked?: boolean;
}

export default function ActivateAgent({ locked }: ActivateAgentProps) {
  const { isConnected } = useAccount();
  const {
    agentAddress,
    isAgentApproved,
    isApproving,
    approveAgent,
    error,
  } = useAgentWallet();

  return (
    <StepCard
      step={3}
      title="Activate Trading Session"
      description="Authorize a temporary signing key so the app can place orders locally. This avoids the wallet's chain-ID restriction on Hyperliquid L1 actions."
      locked={locked}
      completed={isAgentApproved}
    >
      {!isConnected ? (
        <p className="text-sm text-hl-muted">Connect your wallet first.</p>
      ) : isAgentApproved ? (
        <div className="space-y-2">
          <p className="text-sm text-hl-green">
            Agent wallet active for this session
          </p>
          <p className="text-xs text-hl-muted font-mono break-all">
            Agent: {agentAddress}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-hl-muted">
            A temporary key will sign orders on your behalf. It is stored only
            in this browser tab and cleared when you close it.
          </p>
          {agentAddress && (
            <p className="text-xs text-hl-muted font-mono break-all">
              Agent address: {agentAddress}
            </p>
          )}
          <button
            onClick={() => approveAgent().catch(() => {})}
            disabled={isApproving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-hl-bg hover:bg-hl-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApproving ? "Waiting for signature..." : "Activate Agent"}
          </button>
          {error && (
            <p className="text-sm text-hl-red break-all">{error}</p>
          )}
        </div>
      )}
    </StepCard>
  );
}
