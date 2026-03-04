"use client";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

import type { NetworkKey } from "@/config/constants";
import { wagmiConfig } from "@/config/wagmi";
import { AgentWalletProviderInner } from "@/hooks/useAgentWallet";
import { NetworkContext } from "@/hooks/useNetwork";

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
            <AgentWalletProviderInner>{children}</AgentWalletProviderInner>
          </NetworkContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
