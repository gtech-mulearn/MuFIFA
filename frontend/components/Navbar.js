"use client";

import { useState } from "react";

export default function Navbar() {
  const [activeNav, setActiveNav] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 w-full z-50 border-b border-white/5 bg-transparent select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 md:py-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E93] to-[#00E5FF] font-extrabold text-3xl">μ</span>
          <div className="flex flex-col">
            <span className="text-slate-100 font-bold text-sm tracking-wider leading-tight uppercase">
              μLearn World Cup
            </span>
            <span className="text-slate-400 font-semibold text-[10px] tracking-widest uppercase">
              Fantasy '26
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          {["Home", "Products", "Events", "Sevapalley", "Blog", "Contact"].map((item) => {
            const isActive = activeNav === item;
            return (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`group cursor-pointer hover:text-white transition-all relative py-1 ${
                  isActive ? "text-white font-semibold" : ""
                }`}
              >
                {item}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#FF2E93] rounded-full shadow-[0_0_8px_#FF2E93] transition-transform duration-300 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Action Button & Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <button className="hidden md:inline-block cursor-pointer bg-glass border border-[#FF2E93]/30 hover:border-[#FF2E93]/80 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-[#FF2E93] glow-pink-btn bg-gradient-to-r from-pink-500/10 to-transparent">
            ENTER TIK ARENA
          </button>

          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden text-slate-300 hover:text-white cursor-pointer p-2 w-10 h-10 flex items-center justify-center focus:outline-none relative z-50"
            aria-label="Toggle Menu"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
              <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-in-out ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile Responsive Dropdown Menu with Slide & Fade Transitions */}
        <div className={`md:hidden w-full bg-[#080b15]/95 backdrop-blur-lg rounded-xl flex flex-col gap-3 z-50 relative transition-all duration-300 ease-in-out origin-top overflow-hidden border ${
          menuOpen 
            ? "max-h-[380px] opacity-100 scale-y-100 mt-3 p-4 border-white/10 pointer-events-auto" 
            : "max-h-0 opacity-0 scale-y-95 mt-0 p-0 border-transparent pointer-events-none"
        }`}>
          {["Home", "Products", "Events", "Sevapalley", "Blog", "Contact"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setActiveNav(item);
                setMenuOpen(false);
              }}
              className={`text-left text-sm py-1.5 cursor-pointer hover:text-white transition-colors ${
                activeNav === item ? "text-[#FF2E93] font-bold" : "text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
          
          {/* Mobile Action Button */}
          <button className="cursor-pointer bg-glass border border-[#FF2E93]/30 hover:border-[#FF2E93]/80 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider text-[#FF2E93] glow-pink-btn bg-gradient-to-r from-pink-500/10 to-transparent mt-2 text-center w-full">
            ENTER TIK ARENA
          </button>
        </div>

      </div>
    </header>
  );
}
