"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { DWELLIR_BUILDER_ADDRESS } from "@/config/constants";
import { queryMaxBuilderFee } from "@/lib/hyperliquid";
import { useNetwork } from "./useNetwork";

export function useBuilderApproval(builderAddress?: string) {
  const { address } = useAccount();
  const { network } = useNetwork();
  const builder = builderAddress ?? DWELLIR_BUILDER_ADDRESS;

  return useQuery({
    queryKey: ["maxBuilderFee", network, address, builder],
    queryFn: () => queryMaxBuilderFee(network, address!, builder),
    enabled: !!address,
    refetchInterval: network === "mainnet" ? 5_000 : 10_000,
    placeholderData: keepPreviousData,
  });
}
