import { useMobileAuth } from "@/hooks/use-mobile-auth";
import {
  parseWebToNativeBridgeMessage,
  type NativeToWebBridgeMessage,
} from "@greetings/shared";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView, { type WebViewNavigation } from "react-native-webview";
import {
  hostedUrl,
  WEB_ORIGIN,
  CLERK_PUBLISHABLE_KEY,
} from "@/lib/mobile-config";
import { pickAndUploadPhoto } from "@/lib/photo-upload";
import { shareCreation } from "@/lib/native-share";

function isAllowed(url: string) {
  try {
    return new URL(url).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

export function GreetingWebView({ path = "/" }: { path?: string }) {
  const webViewRef = useRef<any>(null);
  const { getToken, isSignedIn } = useMobileAuth();
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const source = useMemo(
    () => ({
      uri: ticket
        ? hostedUrl(`/mobile-auth?ticket=${encodeURIComponent(ticket)}`)
        : hostedUrl(path),
    }),
    [path, ticket],
  );
  const send = useCallback((message: NativeToWebBridgeMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);
  const pickPhoto = useCallback(async () => {
    try {
      const url = await pickAndUploadPhoto(getToken);
      if (url) send({ type: "PHOTO_PICKED", url });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add that photo.",
      );
    }
  }, [getToken, send]);

  useEffect(() => {
    if (!isSignedIn || ticket) return;
    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${WEB_ORIGIN}/api/mobile/auth-ticket`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await response.json()) as { ticket?: string };
        if (!response.ok || !body.ticket) throw new Error();
        setTicket(body.ticket);
      } catch {
        setError("Could not connect your mobile account. Try again.");
      }
    })();
  }, [getToken, isSignedIn, ticket]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!canGoBack) return false;
        webViewRef.current?.goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [canGoBack]);

  function handleNavigation(request: WebViewNavigation) {
    if (isAllowed(request.url)) return true;
    if (/^(mailto:|sms:|https:\/\/wa\.me\/)/i.test(request.url)) {
      void Linking.openURL(request.url).catch(() =>
        setError("This link could not be opened."),
      );
    }
    return false;
  }

  return (
    <View style={styles.container}>
      <NativeWebView
        ref={webViewRef}
        source={source}
        originWhitelist={[WEB_ORIGIN]}
        onShouldStartLoadWithRequest={handleNavigation}
        onNavigationStateChange={(state: { canGoBack: boolean }) =>
          setCanGoBack(state.canGoBack)
        }
        onError={() =>
          setError(
            "The editor could not load. Check your connection and try again.",
          )
        }
        onHttpError={() =>
          setError("The editor is temporarily unavailable. Try again shortly.")
        }
        onMessage={(event: { nativeEvent: { data: string } }) => {
          try {
            const parsed = parseWebToNativeBridgeMessage(
              JSON.parse(event.nativeEvent.data),
            );
            if (!parsed.success) return;
            if (parsed.data.type === "PHOTO_PICKED") void pickPhoto();
            if (parsed.data.type === "REQUEST_SHARE")
              void shareCreation(
                parsed.data.fileUrl,
                parsed.data.linkUrl,
              ).catch(() => setError("The video could not be shared."));
            if (parsed.data.type === "REQUEST_PAYWALL")
              setError(
                "In-app purchases will be available in the next app update.",
              );
          } catch {
            // Ignore malformed or unknown bridge messages.
          }
        }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#7A2430" />
            <Text style={styles.loadingText}>
              Loading your greeting studio…
            </Text>
          </View>
        )}
      />
      {error && (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError("");
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      )}
      {CLERK_PUBLISHABLE_KEY && !isSignedIn && (
        <View style={styles.signedOut}>
          <Text style={styles.signedOutText}>
            Sign in to save, export, and add photos.
          </Text>
        </View>
      )}
    </View>
  );
}

const NativeWebView = WebView as unknown as ComponentType<any>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8E8" },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#173E31", fontSize: 15 },
  error: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 12,
    backgroundColor: "#173E31",
    padding: 16,
  },
  errorText: { color: "#FFF8E8", fontSize: 14 },
  retry: { color: "#F6C662", fontSize: 14, fontWeight: "700", marginTop: 8 },
  signedOut: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 12,
    borderRadius: 10,
    backgroundColor: "#FFF8E8E8",
    padding: 10,
  },
  signedOutText: { color: "#173E31", fontSize: 13, textAlign: "center" },
});
