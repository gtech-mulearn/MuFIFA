"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A slim animated progress bar that appears at the top of the viewport
 * during Next.js App Router route changes (like GitHub/YouTube).
 */
export default function RouteChangeLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const prevSearchRef = useRef(searchParams?.toString());
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const currentSearch = searchParams?.toString();

    // Only trigger on actual navigation (not initial mount)
    if (
      prevPathRef.current !== pathname ||
      prevSearchRef.current !== currentSearch
    ) {
      // Navigation completed — finish the progress bar
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setVisible(false);
        setProgress(0);
      }, 300);
    }

    prevPathRef.current = pathname;
    prevSearchRef.current = currentSearch;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

  // Intercept link clicks to start the loader before navigation begins
  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;

      // Don't trigger for same-page navigation
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname && url.search === (searchParams?.toString() ? `?${searchParams.toString()}` : "")) return;

      // Start loading
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setLoading(true);
      setVisible(true);
      setProgress(15);

      // Simulate progress — fast at first, then slowing down
      let currentProgress = 15;
      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 12;
        if (currentProgress >= 90) {
          currentProgress = 90;
          clearInterval(intervalRef.current);
        }
        setProgress(currentProgress);
      }, 200);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{
          width: `${progress}%`,
          transition: loading
            ? "width 200ms ease-out"
            : "width 200ms ease-in, opacity 200ms ease-in 100ms",
          opacity: loading ? 1 : 0,
        }}
      />
    </div>
  );
}
