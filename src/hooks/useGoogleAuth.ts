import { useCallback, useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import type { CodeResponse } from "@react-oauth/google";

import {
  clearGoogleAccessToken,
  ensureGoogleAccessToken,
  exchangeGoogleAuthCode,
  restoreGoogleAccessToken,
  subscribeGoogleAuthLost,
} from "@/services/google/googleAuth";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  // Write scope required to mark tasks complete via tasks.patch
  "https://www.googleapis.com/auth/tasks",
].join(" ");

const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

export function useGoogleAuthController() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(() =>
    restoreGoogleAccessToken()
  );

  const login = useGoogleLogin({
    flow: "auth-code",
    scope: GOOGLE_SCOPES,
    ux_mode: "popup",
    // GIS supports prompt; @react-oauth/google's auth-code types omit it
    prompt: "consent",
    onSuccess: (codeResponse: CodeResponse) => {
      void (async () => {
        try {
          await exchangeGoogleAuthCode(codeResponse.code);
          setIsAuthorized(true);
          setError(null);
        } catch (err) {
          setIsAuthorized(false);
          setError(
            err instanceof Error
              ? err
              : new Error("Google authorization failed")
          );
        } finally {
          setIsAuthorizing(false);
        }
      })();
    },
    onError: () => {
      setIsAuthorizing(false);
      setError(new Error("Google authorization failed"));
    },
    onNonOAuthError: () => {
      setIsAuthorizing(false);
      setError(new Error("Google authorization was cancelled"));
    },
  } as Parameters<typeof useGoogleLogin>[0]);

  const authorize = useCallback(() => {
    setError(null);
    setIsAuthorizing(true);
    login();
  }, [login]);

  const disconnect = useCallback(() => {
    void clearGoogleAccessToken();
    setIsAuthorized(false);
    setError(null);
  }, []);

  useEffect(() => {
    return subscribeGoogleAuthLost(() => {
      setIsAuthorized(false);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let cancelled = false;

    const refresh = () => {
      void ensureGoogleAccessToken().catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Google token refresh failed"));
        }
      });
    };

    refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthorized]);

  return {
    authorize,
    disconnect,
    isAuthorized,
    isAuthorizing,
    error,
  };
}
