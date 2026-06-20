"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { usePlayer } from "@/components/PlayerContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { player: contextPlayer } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    setPlayer(contextPlayer);
  }, [contextPlayer]);

  const isArenaActive = pathname?.startsWith("/dashboard");

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        setPlayer(null);
        router.push("/login");
      } else {
        console.error("Logout failed.");
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
  };

  // Auth state is synchronized from contextPlayer above

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Match", href: "/match" },
    player ? { name: "Tasks", href: "/tasks" } : null,
    player ? { name: "Profile", href: `/profile/${player.user_id}` } : null,
  ].filter(Boolean);

  return (
    <header className="absolute top-0 left-0 w-full z-50 border-b border-white/5 bg-transparent select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 cursor-pointer group"
        >
          <Image
            src="/trophy.webp"
            alt="World Cup Trophy"
            width={15}
            height={40}
            priority
            className="h-8 md:h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.45)] hover:scale-110 transition-transform duration-300"
          />
          <Image
            src="/Logos/logo.png"
            alt="μLearn Logo"
            width={89}
            height={40}
            priority
            className="h-8 md:h-10 w-auto object-contain hover:scale-105 transition-transform duration-300"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group cursor-pointer hover:text-white transition-all relative py-1 ${
                  isActive ? "text-white font-semibold" : ""
                }`}
              >
                {item.name}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#4F46E5] rounded-full shadow-[0_0_8px_#4F46E5] transition-transform duration-300 origin-left ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {player ? (
            <>
              <Link
                href="/dashboard"
                className={`hidden md:inline-block cursor-pointer px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-all ${
                  isArenaActive
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white border border-transparent shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-[1.02]"
                    : "bg-white border border-white text-black hover:bg-white/90 hover:border-white/90"
                }`}
              >
                ENTER ARENA
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:inline-block cursor-pointer border border-white/20 hover:border-white text-white hover:bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-colors"
              >
                SIGNOUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline-block cursor-pointer border border-white/20 hover:border-white text-white hover:bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-colors"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="hidden md:inline-block cursor-pointer bg-white border border-white hover:bg-white/90 hover:border-white/90 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-black text-center transition-colors"
              >
                SIGN UP
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-300 hover:text-white cursor-pointer p-2 w-10 h-10 flex items-center justify-center focus:outline-none relative z-50"
            aria-label="Toggle Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
              <span
                className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
              />
              <span
                className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
              />
              <span
                className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
              />
            </div>
          </button>
        </div>

        <div
          id="mobile-nav-menu"
          className={`md:hidden w-full bg-[#131927]/95 backdrop-blur-lg rounded-xl flex flex-col gap-3 z-50 relative transition-all duration-300 ease-in-out origin-top overflow-hidden border ${
            menuOpen
              ? "max-h-[420px] opacity-100 scale-y-100 mt-3 p-4 border-white/10 pointer-events-auto"
              : "max-h-0 opacity-0 scale-y-95 mt-0 p-0 border-transparent pointer-events-none"
          }`}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`text-left text-sm py-1.5 cursor-pointer hover:text-white transition-colors ${
                  isActive ? "text-[#4F46E5] font-bold" : "text-slate-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {player ? (
            <div className="flex flex-col gap-2 w-full mt-1">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-all block w-full ${
                  isArenaActive
                    ? "bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white border border-transparent shadow-[0_0_12px_rgba(79,70,229,0.25)]"
                    : "bg-white border border-white text-black hover:bg-white/90 hover:border-white/90"
                }`}
              >
                ENTER ARENA
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="cursor-pointer border border-white/20 hover:border-white text-white hover:bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-colors block w-full"
              >
                SIGNOUT
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full mt-1">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="cursor-pointer border border-white/20 hover:border-white text-white hover:bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-center transition-colors block w-full"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="cursor-pointer bg-white border border-white hover:bg-white/90 hover:border-white/90 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-black text-center transition-colors block w-full"
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
