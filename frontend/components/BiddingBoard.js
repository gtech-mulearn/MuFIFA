import React, { useState } from "react";
import { BrazilFlag, FranceFlag } from "./Flags";

export default function BiddingBoard() {
  const [multiplier, setMultiplier] = useState(10);
  const [uCoins, setUCoins] = useState(250);
  const [bidStatus, setBidStatus] = useState("");

  const handleBidSubmit = (e) => {
    e.preventDefault();
    setBidStatus("Bid placed successfully!");
    setTimeout(() => setBidStatus(""), 3000);
  };

  return (
    <div className="lg:flex-1 bg-glass-card rounded-2xl p-5 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-4 bg-[linear-gradient(110deg,rgba(255,255,255,0.02),rgba(255,46,147,0.015))]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-wide text-white">
            Live Bidding Board
          </h2>
          <p className="text-xs text-slate-400 leading-tight">
            Real-time multiplier cards via real-time multiplier.
          </p>
        </div>
        <button className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full hover:bg-white/10 transition-all cursor-pointer">
          View Info
        </button>
      </div>

      {/* Bidding Grid replaced with Registration Ongoing state */}
      <div className="flex-grow flex flex-col items-center justify-center py-10 px-4 text-center bg-black/30 border border-white/5 rounded-xl min-h-[180px] relative overflow-hidden">
        {/* Glowing aura */}
        <div className="absolute w-24 h-24 bg-[#FF2E93]/10 rounded-full blur-xl animate-pulse" />
        
        {/* Cyberpunk Lock icon */}
        <div className="relative mb-3 flex items-center justify-center w-12 h-12 rounded-full border border-pink-500/30 bg-pink-500/5 text-[#FF2E93] shadow-[0_0_15px_rgba(255,46,147,0.15)] animate-[pulse_2s_ease-in-out_infinite]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <span className="text-xs tracking-[0.2em] text-[#FF2E93] font-black uppercase mb-1 drop-shadow-[0_0_8px_rgba(255,46,147,0.4)]">
          REGISTRATION IS ONGOING
        </span>
        <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
          Bidding arena will unlock once team registrations close.
        </p>
      </div>
    </div>
  );
}
