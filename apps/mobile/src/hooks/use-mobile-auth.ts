import { useAuth } from "@clerk/expo";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/mobile-config";

function useDummyAuth() {
  return {
    isLoaded: true,
    isSignedIn: false,
    getToken: async () => null,
    userId: null,
  };
}

export const useMobileAuth = CLERK_PUBLISHABLE_KEY ? useAuth : useDummyAuth;
