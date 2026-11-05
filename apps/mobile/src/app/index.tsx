import { useSSO } from "@clerk/expo";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GreetingWebView } from "@/components/greeting-webview";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/mobile-config";

function SignInScreenContent({ onClose }: { onClose?: () => void }) {
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signIn = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await startSSOFlow({ strategy: "oauth_google" });
      onClose?.();
    } catch {
      setError("Sign-in did not finish. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [startSSOFlow, onClose]);

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
      {onClose && (
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Continue as Guest</Text>
        </Pressable>
      )}
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <View style={styles.container}>
      <GreetingWebView />
      {CLERK_PUBLISHABLE_KEY && (
        <Modal
          visible={showSignIn}
          animationType="slide"
          onRequestClose={() => setShowSignIn(false)}
        >
          <SignInScreenContent onClose={() => setShowSignIn(false)} />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8E8",
  },
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
  cancelButton: {
    alignItems: "center",
    marginTop: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: { color: "#35584A", fontSize: 15, textDecorationLine: "underline" },
  error: { color: "#9D1F2E", marginTop: 16 },
});
