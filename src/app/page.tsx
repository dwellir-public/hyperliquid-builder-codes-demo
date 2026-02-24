"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Header from "@/components/Header";
import ApprovalStatus from "@/components/ApprovalStatus";
import ApproveBuilder from "@/components/ApproveBuilder";
import ActivateAgent from "@/components/ActivateAgent";
import PlaceOrder from "@/components/PlaceOrder";
import MarketOrder from "@/components/MarketOrder";
import RevokeApproval from "@/components/RevokeApproval";
import AccountPanel from "@/components/AccountPanel";
import { useBuilderApproval } from "@/hooks/useBuilderApproval";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { DWELLIR_BUILDER_ADDRESS } from "@/config/constants";

function ConnectHero() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Builder Codes Demo</h1>
          <p className="text-hl-muted">
            Walk through the complete Hyperliquid builder code lifecycle: approve
            a builder, place orders with builder fees, and revoke approval.
          </p>
        </div>

        <div className="bg-hl-card border border-hl-border rounded-xl p-6 space-y-4">
          <p className="text-sm font-medium">
            Connect your wallet to get started
          </p>
          <p className="text-xs text-hl-muted">
            You'll need a wallet (e.g. MetaMask) with an Arbitrum network
            configured. Start on{" "}
            <span className="text-yellow-400">Testnet</span> to experiment
            without risk.
          </p>
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => (
              <button
                onClick={openConnectModal}
                disabled={!mounted}
                className="w-full px-6 py-3 text-sm font-semibold rounded-lg bg-hl-green text-hl-bg hover:bg-hl-green/90 disabled:opacity-50 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs text-hl-muted">
          <div className="bg-hl-card rounded-lg p-3 border border-hl-border">
            <p className="font-medium text-hl-text mb-1">1. Approve</p>
            <p>Sign to allow builder fees</p>
          </div>
          <div className="bg-hl-card rounded-lg p-3 border border-hl-border">
            <p className="font-medium text-hl-text mb-1">2. Trade</p>
            <p>Place orders with builder code</p>
          </div>
          <div className="bg-hl-card rounded-lg p-3 border border-hl-border">
            <p className="font-medium text-hl-text mb-1">3. Revoke</p>
            <p>Remove builder approval</p>
          </div>
        </div>

        <p className="text-xs text-hl-muted font-mono">
          Builder: {DWELLIR_BUILDER_ADDRESS}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const { data: maxFee } = useBuilderApproval();
  const { isAgentApproved } = useAgentWallet();
  const [coin, setCoin] = useState("ETH");

  const isBuilderApproved = maxFee != null && maxFee > 0;
  const canTrade = isBuilderApproved && isAgentApproved;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {!isConnected ? (
        <ConnectHero />
      ) : (
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-2">
              Builder Codes Workflow
            </h1>
            <p className="text-xs text-hl-muted font-mono">
              Builder: {DWELLIR_BUILDER_ADDRESS}
            </p>
          </div>

          <AccountPanel />

          <ApprovalStatus />
          <ApproveBuilder />
          <ActivateAgent locked={!isBuilderApproved} />
          <PlaceOrder coin={coin} setCoin={setCoin} locked={!canTrade} />
          <MarketOrder coin={coin} setCoin={setCoin} locked={!canTrade} />
          <RevokeApproval locked={!canTrade} />

          <footer className="text-center text-xs text-hl-muted py-8 border-t border-hl-border">
            <p>
              Built by{" "}
              <a
                href="https://dwellir.com"
                className="text-hl-green hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Dwellir
              </a>{" "}
              — Blockchain infrastructure for builders.
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}
