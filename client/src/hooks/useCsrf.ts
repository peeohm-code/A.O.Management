import { useEffect, useState } from "react";

/**
 * Hook to manage CSRF token for client-side requests
 * 
 * This hook fetches the CSRF token from the server and provides
 * a function to include it in request headers
 */

let cachedToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  // If we already have a cached token, return it
  if (cachedToken) {
    return cachedToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // Start a new fetch
  tokenPromise = fetch("/api/csrf-token", {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      cachedToken = data.csrfToken;
      tokenPromise = null;
      return cachedToken!;
    })
    .catch((error) => {
      console.error("[CSRF] Failed to fetch token:", error);
      tokenPromise = null;
      throw error;
    });

  return tokenPromise;
}

export function useCsrf() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [loading, setLoading] = useState(!cachedToken);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cachedToken) {
      fetchCsrfToken()
        .then((t) => {
          setToken(t);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }
  }, []);

  /**
   * Get headers object with CSRF token
   * Use this when making fetch requests
   */
  const getCsrfHeaders = (): Record<string, string> => {
    if (!token) {
      console.warn("[CSRF] Token not available yet");
      return {};
    }
    return {
      "x-csrf-token": token,
    };
  };

  /**
   * Refresh the CSRF token
   * Call this if you get a CSRF validation error
   */
  const refreshToken = async () => {
    cachedToken = null;
    setLoading(true);
    try {
      const newToken = await fetchCsrfToken();
      setToken(newToken);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    token,
    loading,
    error,
    getCsrfHeaders,
    refreshToken,
  };
}

/**
 * Get CSRF token synchronously (for use outside React components)
 * Returns null if token is not yet fetched
 */
export function getCsrfToken(): string | null {
  return cachedToken;
}

/**
 * Ensure CSRF token is fetched and cached
 * Call this early in your app initialization
 */
export async function initializeCsrf(): Promise<void> {
  await fetchCsrfToken();
}
