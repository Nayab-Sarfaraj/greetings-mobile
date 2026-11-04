"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
const AuthEnabled = createContext(false);
export const useAuthEnabled = () => useContext(AuthEnabled);
export function Providers({
  children,
  publishableKey,
}: {
  children: React.ReactNode;
  publishableKey: string | null;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 15000 } },
      }),
  );
  const content = (
    <AuthEnabled.Provider value={Boolean(publishableKey)}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AuthEnabled.Provider>
  );
  return publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>
  ) : (
    content
  );
}
