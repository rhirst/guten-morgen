import { createContext, useContext, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useGoogleAuthController } from "@/hooks/useGoogleAuth";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing VITE_GOOGLE_CLIENT_ID");
}

type GoogleAuthContextValue = ReturnType<typeof useGoogleAuthController>;

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

function GoogleAuthStateProvider({ children }: { children: ReactNode }) {
  const value = useGoogleAuthController();

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleAuthStateProvider>{children}</GoogleAuthStateProvider>
    </GoogleOAuthProvider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);

  if (!context) {
    throw new Error("useGoogleAuth must be used within GoogleAuthProvider");
  }

  return context;
}
