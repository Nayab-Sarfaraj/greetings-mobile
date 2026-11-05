"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useUser as useClerkUser,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
} from "@clerk/nextjs";
import { useAuthEnabled } from "@/components/providers";

export type AppUser = {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
};

type AppAuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AppUser | null;
  signIn: () => void;
  signOut: () => void;
  isDevMode: boolean;
};

const DEV_USER: AppUser = {
  id: "dev_local_user",
  firstName: "Dev",
  fullName: "Dev Creator",
  email: "dev@cherryqube.local",
};

const DevAuthContext = createContext<AppAuthContextValue>({
  isLoaded: true,
  isSignedIn: true,
  user: DEV_USER,
  signIn: () => {},
  signOut: () => {},
  isDevMode: true,
});

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Read cookie/localStorage for dev sign-in status
    const isSignedOut =
      typeof document !== "undefined" &&
      document.cookie.includes("dev_user_id=signed_out");
    setIsSignedIn(!isSignedOut);
    setIsLoaded(true);
  }, []);

  const signIn = () => {
    if (typeof document !== "undefined") {
      document.cookie = "dev_user_id=dev_local_user; path=/; max-age=604800";
    }
    setIsSignedIn(true);
  };

  const signOut = () => {
    if (typeof document !== "undefined") {
      document.cookie = "dev_user_id=signed_out; path=/; max-age=604800";
    }
    setIsSignedIn(false);
  };

  return (
    <DevAuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        user: isSignedIn ? DEV_USER : null,
        signIn,
        signOut,
        isDevMode: true,
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

// Internal hook for Clerk mode
function useClerkAuth(): AppAuthContextValue {
  const { isLoaded, isSignedIn, user: clerkUser } = useClerkUser();

  const user: AppUser | null = clerkUser
    ? {
        id: clerkUser.id,
        firstName: clerkUser.firstName ?? "User",
        fullName: clerkUser.fullName ?? clerkUser.firstName ?? "User",
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      }
    : null;

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    user,
    signIn: () => {},
    signOut: () => {},
    isDevMode: false,
  };
}

export function useAppAuth(): AppAuthContextValue {
  const clerkActive = useAuthEnabled();
  const devAuth = useContext(DevAuthContext);

  if (!clerkActive) {
    return devAuth;
  }

  // When Clerk is active, use Clerk's hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerkAuth();
}

export function AppSignInButton({
  children,
  mode = "modal",
}: {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
}) {
  const clerkActive = useAuthEnabled();
  const { signIn } = useContext(DevAuthContext);

  if (clerkActive) {
    return <ClerkSignInButton mode={mode}>{children}</ClerkSignInButton>;
  }

  return (
    <span onClick={signIn} className="cursor-pointer">
      {children}
    </span>
  );
}

export function AppUserButton() {
  const clerkActive = useAuthEnabled();
  const { user, signOut } = useContext(DevAuthContext);
  const [open, setOpen] = useState(false);

  if (clerkActive) {
    return <ClerkUserButton />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-medium text-white shadow-sm focus-visible:outline-4 focus-visible:outline-accent"
        aria-label="User account menu"
        aria-expanded={open}
      >
        {user?.firstName?.[0] ?? "D"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink/20 bg-paper p-4 shadow-lg z-50">
          <p className="font-semibold text-ink">{user?.fullName}</p>
          <p className="text-xs text-ink/70">{user?.email}</p>
          <div className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Dev Auth Mode
          </div>
          <hr className="my-3 border-ink/10" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full rounded-lg border border-accent/40 px-3 py-1.5 text-left text-sm text-accent hover:bg-accent hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppAuthControls() {
  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-ink/10" />;
  }

  if (!isSignedIn) {
    return (
      <AppSignInButton>
        <button
          type="button"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-4 focus-visible:outline-accent"
        >
          Sign in
        </button>
      </AppSignInButton>
    );
  }

  return <AppUserButton />;
}
