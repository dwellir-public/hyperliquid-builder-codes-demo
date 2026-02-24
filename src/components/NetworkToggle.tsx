"use client";

import { useState } from "react";
import { useNetwork } from "@/hooks/useNetwork";
import { useQueryClient } from "@tanstack/react-query";
import { useSwitchChain } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

export default function NetworkToggle() {
  const { network, setNetwork } = useNetwork();
  const queryClient = useQueryClient();
  const { switchChain } = useSwitchChain();
  const [showWarning, setShowWarning] = useState(false);

  const switchTo = (target: "testnet" | "mainnet") => {
    setNetwork(target);
    queryClient.invalidateQueries();
    switchChain?.({
      chainId: target === "testnet" ? arbitrumSepolia.id : arbitrum.id,
    });
  };

  const toggle = () => {
    if (network === "testnet") {
      setShowWarning(true);
    } else {
      switchTo("testnet");
    }
  };

  const confirmMainnet = () => {
    setShowWarning(false);
    switchTo("mainnet");
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-hl-border hover:border-hl-muted transition-colors"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            network === "testnet" ? "bg-yellow-400" : "bg-hl-green"
          }`}
        />
        {network === "testnet" ? "Testnet" : "Mainnet"}
      </button>

      {showWarning && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-hl-card border border-hl-red/40 rounded-xl p-4 shadow-xl">
          <p className="text-sm font-medium text-white mb-1">
            Switching to Mainnet
          </p>
          <p className="text-xs text-hl-muted mb-3">
            Orders will use real funds. Make sure you understand the risks
            before proceeding.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmMainnet}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-hl-red text-white hover:bg-hl-red/80 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-hl-border text-hl-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
