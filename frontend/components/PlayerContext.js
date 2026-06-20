"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer(data.data);
      } else {
        setPlayer(null);
      }
    } catch (err) {
      console.error("PlayerProvider auth fetch error:", err);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch on pathname change (navigating between pages)
  useEffect(() => {
    fetchPlayer();
  }, [pathname, fetchPlayer]);

  return (
    <PlayerContext.Provider value={{ player, loading, refreshPlayer: fetchPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export default PlayerContext;
