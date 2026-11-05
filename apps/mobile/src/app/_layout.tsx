import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/mobile-config";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY)
    return <Stack screenOptions={{ headerShown: false }} />;
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
