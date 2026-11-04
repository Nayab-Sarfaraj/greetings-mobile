"use client";
import { useQuery } from "@tanstack/react-query";
import type { PublicResult } from "@greetings/shared";
import { api } from "@/lib/api-client";
export function useResult(initial: PublicResult) {
  return useQuery({
    queryKey: ["public-result", initial.shareId],
    queryFn: () =>
      api<PublicResult>(`/api/public/cards/${initial.shareId}`, {
        cache: "no-store",
      }),
    initialData: initial,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.status === "processing"
        ? Math.min(15000, 2000 * 2 ** query.state.fetchFailureCount)
        : false,
  });
}
