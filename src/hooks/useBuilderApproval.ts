"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useNetwork } from "./useNetwork";
import { queryMaxBuilderFee } from "@/lib/hyperliquid";
import { DWELLIR_BUILDER_ADDRESS } from "@/config/constants";

export function useBuilderApproval(builderAddress?: string) {
  const { address } = useAccount();
  const { network } = useNetwork();
  const builder = builderAddress ?? DWELLIR_BUILDER_ADDRESS;

  return useQuery({
    queryKey: ["maxBuilderFee", network, address, builder],
    queryFn: () => queryMaxBuilderFee(network, address!, builder),
    enabled: !!address,
    refetchInterval: network === "mainnet" ? 5_000 : 10_000,
  });
}
