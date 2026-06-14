"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Register", href: "/register" },
  ];

  return (
    <header className="absolute top-0 left-0 w-full z-50 border-b border-white/5 bg-transparent select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 cursor-pointer group"
        >
          <Image
            src="/trophy.png"
            alt="World Cup Trophy"
            width={15}
            height={40}
            priority
            className="h-8 md:h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.45)] hover:scale-110 transition-transform duration-300"
          />
          <Image
            src="/logo.png"
            alt="μLearn Logo"
            width={89}
            height={40}
            priority
            className="h-8 md:h-10 w-auto object-contain hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Navigation Links */}
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
                  className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#FF2E93] rounded-full shadow-[0_0_8px_#FF2E93] transition-transform duration-300 origin-left ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden md:inline-block cursor-pointer bg-glass border border-[#FF2E93]/30 hover:border-[#FF2E93]/80 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-[#FF2E93] glow-pink-btn bg-gradient-to-r from-pink-500/10 to-transparent text-center"
          >
            ENTER ARENA
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-300 hover:text-white cursor-pointer p-2 w-10 h-10 flex items-center justify-center focus:outline-none relative z-50"
            aria-label="Toggle Menu"
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

        {/* Mobile Responsive Dropdown Menu with Slide & Fade Transitions */}
        <div
          className={`md:hidden w-full bg-[#080b15]/95 backdrop-blur-lg rounded-xl flex flex-col gap-3 z-50 relative transition-all duration-300 ease-in-out origin-top overflow-hidden border ${
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
                  isActive ? "text-[#FF2E93] font-bold" : "text-slate-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          {/* Mobile Action Button */}
          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer bg-glass border border-[#FF2E93]/30 hover:border-[#FF2E93]/80 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider text-[#FF2E93] glow-pink-btn bg-gradient-to-r from-pink-500/10 to-transparent mt-2 text-center w-full block"
          >
            ENTER ARENA
          </Link>
        </div>
      </div>
    </header>
  );
}
