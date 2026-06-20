"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

const PlayerContext = createContext({
  player: null,
  loading: true,
  refreshPlayer: () => {},
});

/**
 * Hook for consuming the player context.
 * Returns { player, loading, refreshPlayer }.
 */
export function usePlayer() {
  return useContext(PlayerContext);
}

/**
 * Provider that fetches player auth data once and shares it via context.
 * Wrap this around routes that need player data (inside LayoutContent or layout).
 */
export function PlayerProvider({ children }) {
  const pathname = usePathname();
  
  // Initialize player state from localStorage if available (fast path)
  const [player, setPlayer] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("player");
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // If we already have player data in localStorage, loading starts as false
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("player");
    }
    return true;
  });

  const lastFetchTimeRef = useRef(0);

  const fetchPlayer = useCallback(async (force = false) => {
    // Throttling: only fetch in background if forced, or if it's been > 6 seconds since last fetch
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 6000) {
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      const res = await fetch("/api/v1/auth/me");
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer(data.data);
        localStorage.setItem("player", JSON.stringify(data.data));
      } else {
        setPlayer(null);
        localStorage.removeItem("player");
      }
    } catch (err) {
      console.error("PlayerProvider auth fetch error:", err);
      // Keep existing player state on network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount (forced to ensure fresh state at start)
  useEffect(() => {
    fetchPlayer(true);
  }, [fetchPlayer]);

  // Fetch on pathname change, but throttled to prevent redundant parallel requests
  useEffect(() => {
    fetchPlayer(false);
  }, [pathname, fetchPlayer]);

  return (
    <PlayerContext.Provider value={{ player, loading, refreshPlayer: () => fetchPlayer(true) }}>
      {children}
    </PlayerContext.Provider>
  );
}

export default PlayerContext;
