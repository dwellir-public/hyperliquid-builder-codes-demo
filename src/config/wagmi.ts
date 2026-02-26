"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Hyperliquid Builder Codes Demo",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [arbitrum],
  ssr: true,
});
