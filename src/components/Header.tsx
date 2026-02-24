"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import NetworkToggle from "./NetworkToggle";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-hl-border">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-tight">
          Hyperliquid Builder Codes
        </h1>
        <span className="text-xs text-hl-muted bg-hl-card px-2 py-0.5 rounded">
          Demo
        </span>
      </div>
      <div className="flex items-center gap-3">
        <NetworkToggle />
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none" as const,
                    userSelect: "none" as const,
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-hl-bg hover:bg-hl-green/90 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-hl-red text-white"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-hl-border hover:border-hl-muted transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-hl-green" />
                      <span className="font-mono text-xs">
                        {account.displayName}
                      </span>
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
