"use client";

import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";
import { fetchReferral } from "@/lib/hyperliquid";
import { DWELLIR_BUILDER_ADDRESS } from "@/config/constants";

export function useBuilderIncome() {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["builderIncome", network],
    queryFn: async () => {
      const data = await fetchReferral(network, DWELLIR_BUILDER_ADDRESS);
      return {
        builderRewards: parseFloat(data.builderRewards),
        cumVlm: parseFloat(data.cumVlm),
      };
    },
    refetchInterval: 5_000,
  });
}
