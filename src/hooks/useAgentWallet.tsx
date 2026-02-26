"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAccount } from "wagmi";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import type { WalletClient as HLWalletClient } from "@nktkas/hyperliquid";
import { useHyperliquid } from "./useHyperliquid";
import { useNetwork } from "./useNetwork";
import { createAgentWalletClient } from "@/lib/hyperliquid";

const STORAGE_PREFIX = "hl-agent-key-";

function loadAgentKey(userAddress: string): Hex | null {
  const storageKey = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
  const stored = sessionStorage.getItem(storageKey);
  if (stored && stored.startsWith("0x")) return stored as Hex;
  return null;
}

function createAndStoreAgentKey(userAddress: string): Hex {
  const storageKey = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
  const pk = generatePrivateKey();
  sessionStorage.setItem(storageKey, pk);
  return pk;
}

function removeAgentKey(userAddress: string): void {
  const storageKey = `${STORAGE_PREFIX}${userAddress.toLowerCase()}`;
  sessionStorage.removeItem(storageKey);
}

interface AgentWalletState {
  agentWalletClient: HLWalletClient | null;
  agentAddress: `0x${string}` | null;
  isAgentApproved: boolean;
  isApproving: boolean;
  approveAgent: () => Promise<void>;
  deactivateAgent: () => void;
  error: string | null;
}

const defaultState: AgentWalletState = {
  agentWalletClient: null,
  agentAddress: null,
  isAgentApproved: false,
  isApproving: false,
  approveAgent: async () => {},
  deactivateAgent: () => {},
  error: null,
};

export const AgentWalletContext = createContext<AgentWalletState>(defaultState);

/**
 * Provider component — must be rendered once inside the Providers tree.
 * All consumers of `useAgentWallet()` share this single instance of state.
 */
export function AgentWalletProviderInner({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { network } = useNetwork();
  const { walletClient: userWalletClient } = useHyperliquid();
  const [agentPrivateKey, setAgentPrivateKey] = useState<Hex | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore key from sessionStorage when the wallet address changes (or on mount)
  useEffect(() => {
    if (!address) {
      setAgentPrivateKey(null);
      setIsApproved(false);
      setError(null);
      return;
    }
    const existing = loadAgentKey(address);
    setAgentPrivateKey(existing); // null if nothing stored
    setIsApproved(false);
    setError(null);
  }, [address]);

  const agentAccount = useMemo(() => {
    if (!agentPrivateKey) return null;
    return privateKeyToAccount(agentPrivateKey);
  }, [agentPrivateKey]);

  const agentWalletClient = useMemo(() => {
    if (!agentAccount) return null;
    return createAgentWalletClient(network, agentAccount);
  }, [network, agentAccount]);

  const approveAgent = useCallback(async () => {
    if (!userWalletClient || !address) {
      throw new Error("Wallet not connected");
    }

    // Use existing key from storage, or generate a fresh one
    let pk = loadAgentKey(address);
    if (!pk) {
      pk = createAndStoreAgentKey(address);
    }
    setAgentPrivateKey(pk);

    const account = privateKeyToAccount(pk);

    setIsApproving(true);
    setError(null);
    try {
      await userWalletClient.approveAgent({
        agentAddress: account.address,
        agentName: "DwellirBuilder",
      });
      setIsApproved(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // "already used" means this agent key was approved in a prior page load
      if (msg.toLowerCase().includes("already used")) {
        setIsApproved(true);
        return;
      }
      setError(msg);
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, [userWalletClient, address]);

  const deactivateAgent = useCallback(() => {
    if (!address) return;
    removeAgentKey(address);
    setAgentPrivateKey(null);
    setIsApproved(false);
    setError(null);
  }, [address]);

  const value = useMemo<AgentWalletState>(
    () => ({
      agentWalletClient,
      agentAddress: agentAccount?.address ?? null,
      isAgentApproved: isApproved,
      isApproving,
      approveAgent,
      deactivateAgent,
      error,
    }),
    [agentWalletClient, agentAccount, isApproved, isApproving, approveAgent, deactivateAgent, error]
  );

  return (
    <AgentWalletContext.Provider value={value}>
      {children}
    </AgentWalletContext.Provider>
  );
}

/**
 * Hook to access the shared agent wallet state.
 * All components calling this hook share the same approval state.
 */
export function useAgentWallet(): AgentWalletState {
  return useContext(AgentWalletContext);
}
