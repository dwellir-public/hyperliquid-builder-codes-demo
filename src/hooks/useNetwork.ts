"use client";

import { createContext, useContext } from "react";
import type { NetworkKey } from "@/config/constants";

export interface NetworkContextValue {
  network: NetworkKey;
  setNetwork: (n: NetworkKey) => void;
}

export const NetworkContext = createContext<NetworkContextValue>({
  network: "testnet",
  setNetwork: () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}
