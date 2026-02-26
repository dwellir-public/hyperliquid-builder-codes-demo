"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { wagmiConfig } from "@/config/wagmi";
import { NetworkContext } from "@/hooks/useNetwork";
import { AgentWalletProviderInner } from "@/hooks/useAgentWallet";
import type { NetworkKey } from "@/config/constants";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkKey>("mainnet");

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#52B196",
            accentColorForeground: "#FFFFFF",
            borderRadius: "medium",
          })}
        >
          <NetworkContext.Provider value={{ network, setNetwork }}>
            <AgentWalletProviderInner>
              {children}
            </AgentWalletProviderInner>
          </NetworkContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
