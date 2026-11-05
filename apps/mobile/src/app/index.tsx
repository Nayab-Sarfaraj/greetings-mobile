import { useAuth, useSSO } from "@clerk/expo";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GreetingWebView } from "@/components/greeting-webview";
import { CLERK_PUBLISHABLE_KEY, WEB_ORIGIN } from "@/lib/mobile-config";

function SignInScreen() {
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signIn = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await startSSOFlow({ strategy: "oauth_google" });
    } catch {
      setError("Sign-in did not finish. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [startSSOFlow]);
  return (
    <SafeAreaView style={styles.auth}>
      <Text style={styles.brand}>CherryQube</Text>
      <Text style={styles.title}>Make a greeting worth keeping.</Text>
      <Text style={styles.copy}>
        Sign in securely to save, add a photo, and export your video.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void signIn()}
        style={styles.button}
      >
        {busy ? (
          <ActivityIndicator color="#FFF8E8" />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </SafeAreaView>
  );
}

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7A2430" />
      </View>
    );
  return isSignedIn ? <GreetingWebView /> : <SignInScreen />;
}

export default function HomeScreen() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <SafeAreaView style={styles.auth}>
        <Text style={styles.brand}>CherryQube</Text>
        <Text style={styles.title}>Mobile sign-in needs configuration.</Text>
        <Text style={styles.copy}>
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and EXPO_PUBLIC_WEB_ORIGIN to
          apps/mobile/.env.local. The current editor origin is {WEB_ORIGIN}.
        </Text>
      </SafeAreaView>
    );
  }
  return <App />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E8",
  },
  auth: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#FFF8E8",
  },
  brand: {
    color: "#7A2430",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#173E31",
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 12,
  },
  copy: { color: "#35584A", fontSize: 17, lineHeight: 25, marginTop: 16 },
  button: {
    alignItems: "center",
    backgroundColor: "#7A2430",
    borderRadius: 999,
    marginTop: 28,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonText: { color: "#FFF8E8", fontSize: 16, fontWeight: "700" },
  error: { color: "#9D1F2E", marginTop: 16 },
});
