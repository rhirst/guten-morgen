import { useCallback, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import type { TokenResponse } from "@react-oauth/google";

import {
  clearGoogleAccessToken,
  restoreGoogleAccessToken,
  setGoogleAccessToken,
} from "@/services/google/googleAuth";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks.readonly",
].join(" ");

export function useGoogleAuthController() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(() =>
    restoreGoogleAccessToken()
  );

  const login = useGoogleLogin({
    flow: "implicit",
    scope: GOOGLE_SCOPES,

    onSuccess: (tokenResponse: TokenResponse) => {
      setGoogleAccessToken(
        tokenResponse.access_token,
        tokenResponse.expires_in
      );

      setIsAuthorized(true);
      setIsAuthorizing(false);
      setError(null);
    },

    onError: () => {
      setIsAuthorizing(false);
      setError(new Error("Google authorization failed"));
    },
  });

  const authorize = useCallback(() => {
    setError(null);
    setIsAuthorizing(true);

    login();
  }, [login]);

  const disconnect = useCallback(() => {
    clearGoogleAccessToken();
    setIsAuthorized(false);
    setError(null);
  }, []);

  return {
    authorize,
    disconnect,
    isAuthorized,
    isAuthorizing,
    error,
  };
}
