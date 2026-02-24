"use client";

import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";
import { fetchAllMids, fetchMeta } from "@/lib/hyperliquid";

export function useAllMids() {
  const { network } = useNetwork();
  return useQuery({
    queryKey: ["allMids", network],
    queryFn: () => fetchAllMids(network),
    refetchInterval: 5_000,
  });
}

export function useMeta() {
  const { network } = useNetwork();
  return useQuery({
    queryKey: ["meta", network],
    queryFn: () => fetchMeta(network),
    staleTime: 60_000,
  });
}
