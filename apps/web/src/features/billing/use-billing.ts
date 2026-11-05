"use client";
import { useAppAuth } from "@/components/auth/app-auth";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PackCatalog, CheckoutStatus } from "@greetings/shared";
import { api } from "@/lib/api-client";
export function useCreditBalance() {
  const { user } = useAppAuth();
  return useQuery({
    queryKey: ["credits", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<{ balance: number }>("/api/entitlements"),
    staleTime: 0,
  });
}
export function useBilling(prepareDraft: () => Promise<{ id: string }>) {
  const { user } = useAppAuth();
  const client = useQueryClient();
  const [returnInfo, setReturnInfo] = useState<{
    state: string;
    id: string | null;
    started: number;
  } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setReturnInfo({
        state: params.get("checkout") ?? "",
        id: params.get("checkout_id"),
        started: Date.now(),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const catalog = useQuery({
    queryKey: ["export-packs"],
    queryFn: () => api<PackCatalog>("/api/packs"),
    staleTime: 60000,
  });
  const balance = useCreditBalance();
  const checkout = useMutation({
    mutationFn: async (packId: string) => {
      const saved = await prepareDraft();
      const result = await api<{ url: string; id: string }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          packId,
          invitationId: saved.id,
          acceptTerms: true,
        }),
      });
      return result;
    },
    onSuccess: ({ url }) => window.location.assign(url),
  });
  const confirmation = useQuery({
    queryKey: [
      "checkout-return",
      user?.id,
      returnInfo?.id,
      returnInfo?.started,
    ],
    queryFn: () => api<CheckoutStatus>(`/api/checkout/${returnInfo?.id}`),
    enabled: returnInfo?.state === "success" && Boolean(returnInfo.id),
    staleTime: 0,
    retry: 1,
    refetchInterval: (query) =>
      query.state.data?.confirmed ||
      Date.now() - (returnInfo?.started ?? 0) >= 30000
        ? false
        : 2000,
  });
  useEffect(() => {
    if (confirmation.data?.confirmed) {
      void client.invalidateQueries({ queryKey: ["credits"] });
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("checkout_id");
      window.history.replaceState(null, "", url);
    }
  }, [confirmation.data?.confirmed, client]);
  return {
    catalog,
    balance,
    checkout,
    confirmation,
    returnInfo,
    recheck: () =>
      setReturnInfo((old) => (old ? { ...old, started: Date.now() } : old)),
  };
}
