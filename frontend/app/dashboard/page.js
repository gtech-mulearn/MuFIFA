"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TEAM_FLAGS } from "@/utils/constants";
import Header from "../tasks/components/Header/Header";
import { usePlayer } from "@/components/PlayerContext";

const DOMAIN_STYLES = {
  Coder: "bg-cyan-500/10 border-cyan-500/35 text-cyan-400",
  Creative: "bg-pink-500/10 border-pink-500/35 text-pink-400",
  Strategist: "bg-amber-500/10 border-amber-500/35 text-amber-400",
  Maker: "bg-indigo-500/10 border-indigo-500/35 text-indigo-400",
};

// Animated "ACTIVE REWARD" badge
function ActiveRewardSeal() {
  return (
    <div className="relative w-16 h-16 md:w-18 md:h-18 select-none shrink-0 pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="seal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#FF6F00" />
          </linearGradient>
          <path
            id="textPath-circle"
            d="M 50 16 A 34 34 0 1 1 49.9 16"
            fill="none"
          />
        </defs>

        {/* Dashed outer ring that rotates */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#seal-gold)"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          className="animate-[spin_25s_linear_infinite]"
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Inner solid ring */}
        <circle
          cx="50"
          cy="50"
          r="37"
          fill="none"
          stroke="url(#seal-gold)"
          strokeWidth="1"
          opacity="0.4"
        />

        {/* Star in center */}
        <g fill="url(#seal-gold)">
          <path d="M 50 32 L 54.5 42 L 65 43.5 L 57.5 51 L 59.5 61.5 L 50 56.5 L 40.5 61.5 L 42.5 51 L 35 43.5 L 45.5 42 Z" />
        </g>

        {/* Text curving around the circle */}
        <text
          fill="url(#seal-gold)"
          fontSize="6.2"
          fontWeight="900"
          letterSpacing="1.8"
        >
          <textPath href="#textPath-circle" startOffset="0%">
            ACTIVE REWARD • ACTIVE REWARD • ACTIVE REWARD •
          </textPath>
        </text>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { player: contextPlayer, loading } = usePlayer();
  const [player, setPlayer] = useState(null);
  const [generatingReferral, setGeneratingReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // News States
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Sync context player to local state (needed for referral update)
  React.useEffect(() => {
    if (contextPlayer) {
      setPlayer(contextPlayer);
    }
  }, [contextPlayer]);

  // Fetch news updates
  React.useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/v1/news");
        const data = await res.json();
        if (res.ok && data.success) {
          setNews((data.data || []).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch news on dashboard:", err);
      } finally {
        setLoadingNews(false);
      }
    }
    fetchNews();
  }, []);
  // Scroll Reference & Auto Scroll Loop
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container || news.length <= 1) return;

    let intervalId;
    const autoScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;

      if (container.scrollTop >= maxScroll - 1) {
        clearInterval(intervalId);
        setTimeout(() => {
          container.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            intervalId = setInterval(autoScroll, 40);
          }, 1200);
        }, 3000);
      } else {
        container.scrollTop += 0.8;
      }
    };

    intervalId = setInterval(autoScroll, 40);

    const handleMouseEnter = () => clearInterval(intervalId);
    const handleMouseLeave = () => {
      clearInterval(intervalId);
      intervalId = setInterval(autoScroll, 40);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearInterval(intervalId);
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [news]);
  const handleCreateReferral = async () => {
    setGeneratingReferral(true);
    setError("");
    try {
      const res = await fetch("/api/v1/profile/referral", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer((prev) => ({
          ...prev,
          referal_id: data.data.referal_id,
        }));
      } else {
        setError(data.error?.message || "Failed to generate referral link.");
      }
    } catch (err) {
      console.error("Referral creation error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setGeneratingReferral(false);
    }
  };

  const handleCopyLink = () => {
    if (!player?.referal_id) return;
    const referralLink = `${window.location.origin}/register?ref=${player.referal_id}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  const referralUrl = player?.referal_id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${player.referal_id}`
    : "";

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* TOP N ARENA BANNER (with stadium background) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        {/* Dark gradient overlay to fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10">
          <Header
            title="ARENA"
            highlightedTitle="PROFILE"
            subtitle="Welcome back. Monitor your performance, review squad metrics, and complete active challenges."
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 w-full relative z-10 flex-1 flex flex-col gap-8">
        {/* Player Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Player Profile */}
          <Link
            href={`/profile/${player?.user_id}`}
            className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[150px] relative overflow-hidden group hover:border-white/15 transition-all cursor-pointer font-sans"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold flex items-center justify-between">
                <span>Player Profile</span>
                <span className="text-[9px] text-[#06B6D4] opacity-80 group-hover:opacity-100 group-hover:underline transition-all">
                  View Card →
                </span>
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide truncate mt-2">
                {player?.name || "Adhwith A S"}
              </h3>
              <div className="mt-2.5">
                <span
                  className={`w-fit text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${DOMAIN_STYLES[player?.domain] || "bg-white/5 border-white/10 text-white"}`}
                >
                  {player?.domain || "CODER"}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-4">
              Profile ID: {player?.user_id || "12345353565770"}
            </span>
          </Link>

          {/* Card 2: Current Team */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between min-h-[150px] relative overflow-hidden hover:border-white/15 transition-all">
            {/* Right side jersey background container */}
            <div className="absolute right-0 top-0 bottom-0 w-[100%] bg-[#D0C4AC] overflow-hidden pointer-events-none select-none z-0">
              {player?.team ? (
                <img
                  src={`/Jersey/${player.team === "Netherlands" ? "Netherland" : player.team}.svg`}
                  alt="Team Jersey"
                  className="absolute left-[90px] top-1/2 -translate-y-1/2 h-[110%] w-auto object-contain object-left"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-slate-700/50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M 6 4 L 9 2 L 15 2 L 18 4 L 21 7 L 18 9 L 17 8 L 17 21 L 7 21 L 7 8 L 6 9 L 3 7 Z"
                      fill="rgba(0,0,0,0.1)"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 z-10">
              <span className="text-[10px] uppercase tracking-wider text-blue-900 font-extrabold">
                Current Team
              </span>
              <div className="mt-3 flex items-center gap-6">
                {/* Large rectangular flag */}
                {player?.team ? (
                  <span
                    className={`fi fi-${TEAM_FLAGS[player.team] || "un"} rounded-md border border-white/10 shrink-0 shadow-md`}
                    style={{
                      width: "64px",
                      height: "44px",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <div className="w-16 h-11 bg-white/5 border border-white/10 rounded-md flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <span className="text-sm font-bold tracking-widest text-white-900 uppercase mt-4 z-10">
              {player?.team || "Unselected"}
            </span>
          </div>

          {/* Card 3: Performance Score */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex items-center justify-between min-h-[150px] hover:border-white/15 transition-all">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">
                Performance Score
              </span>
              <div className="mt-3">
                <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">
                  Total Score
                </span>
                <div className="text-3xl md:text-4xl font-extrabold text-[#FBBF24] flex items-baseline gap-1.5 mt-1.5 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <span>{player?.mu_points || 0}</span>
                  <span className="text-[11px] font-bold text-amber-500/90 tracking-wide">
                    μPoints
                  </span>
                </div>
              </div>
            </div>

            {/* Greek letter μ with motion lines replaced with coin logo */}
            <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
              <Image
                src="/mupoints.webp"
                alt="μPoints Logo"
                fill
                className="object-contain select-none"
              />
            </div>
          </div>
        </div>

        {/* Challenges & Referral Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Referral Program Card (takes 2 cols on lg screens) */}
          <div className="lg:col-span-2 bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col gap-6 hover:border-white/15 transition-all">
            {/* Animated Active Reward Seal in the top-right */}
            <div className="absolute right-4 top-4 md:right-6 md:top-6 z-10">
              <ActiveRewardSeal />
            </div>

            {/* Title Section */}
            <div className="pr-20" id="#ref-prgrm">
              <h2 className="text-2xl font-extrabold text-white tracking-wide uppercase">
                Referral Program
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                Invite colleagues to register and earn performance rewards.
              </p>
            </div>

            {/* Inset Instructions Panel */}
            <div className="bg-[#090b15]/60 border border-white/5 rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-300">
                Invite new players to join the{" "}
                <span className="text-cyan-400 font-semibold">μFifa '26</span>{" "}
                arena. Upon successful registration:
              </p>
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15a7 7 0 007-7V4H5v4a7 7 0 007 7zm0 0v4m0 0H8m4 0h4m-9-8H3m18 0h-2"
                    />
                  </svg>
                  <span className="text-[11px] text-slate-400 leading-normal">
                    You receive{" "}
                    <strong className="text-white font-bold">+5 μPoints</strong>{" "}
                    directly.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15a7 7 0 007-7V4H5v4a7 7 0 007 7zm0 0v4m0 0H8m4 0h4m-9-8H3m18 0h-2"
                    />
                  </svg>
                  <span className="text-[11px] text-slate-400 leading-normal">
                    Your squad's total score increases by{" "}
                    <strong className="text-[#06B6D4] font-bold">
                      5 points
                    </strong>
                    .
                  </span>
                </div>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2.5 px-4 rounded-xl flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-red-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Link Copy & Referrals List Container */}
            <div className="flex flex-col gap-5 mt-auto">
              {/* Link Copy Field */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Your Referral Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl || "No referral link generated yet."}
                    placeholder="Click generate to create your link..."
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 select-all focus:outline-none flex-1 truncate"
                  />
                  {!player?.referal_id ? (
                    <button
                      onClick={handleCreateReferral}
                      disabled={generatingReferral}
                      className="cursor-pointer px-5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center justify-center min-w-[120px] shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                    >
                      {generatingReferral ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        "Generate"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCopyLink}
                      className="cursor-pointer px-5 bg-[#131927] hover:bg-white/5 active:bg-[#0d101d] text-[#38BDF8] border border-white/10 hover:border-white/20 transition-all font-semibold rounded-xl text-xs shrink-0 flex items-center justify-center min-w-[120px]"
                    >
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  )}
                </div>
              </div>

              {/* View Referrals Link */}
              <div className="pt-4 border-t border-white/5">
                <Link
                  href="/points-history"
                  className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl p-3 hover:border-white/10 hover:bg-black/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <svg
                      className="w-4 h-4 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                      View Referral & Points History
                    </span>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: News & Updates (1 column on lg screens) */}
          <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col gap-4 hover:border-white/15 transition-all lg:col-span-1 min-h-[380px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Arena Feed
              </h2>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto flex flex-col gap-3.5 max-h-[340px] no-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none !important;
                }
              `}</style>
              {loadingNews ? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : news.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
                  No arena announcements found.
                </div>
              ) : (
                news.map((item) => (
                  <div
                    key={item.id}
                    className="group/news flex flex-col gap-2.5 pb-4 border-b border-white/5 last:border-b-0 last:pb-0 last:border-none"
                  >
                    {/* Header: Type Name & Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {item.type === "task"
                          ? "Task Release"
                          : item.type === "video"
                            ? "Video Release"
                            : item.type === "info"
                              ? "Alert"
                              : "Info"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold shrink-0">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Main Image (Instagram Style) */}
                    {item.image_url && (
                      <div className="relative w-full rounded-lg overflow-hidden border border-white/5 bg-black/20">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-auto object-contain group-hover/news:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Title, Content & Action Link below the image */}
                    <div className="flex flex-col gap-1.5 mt-0.5">
                      <h4 className="text-xs font-black text-white group-hover/news:text-cyan-400 transition-colors leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {item.content}
                      </p>

                      {item.action_url && (
                        <a
                          href={item.action_url}
                          target={
                            item.action_url.startsWith("http")
                              ? "_blank"
                              : "_self"
                          }
                          rel="noopener noreferrer"
                          className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 hover:underline mt-0.5 self-start"
                        >
                          <span>View Details</span>
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Challenges Row */}
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
              Challenges Progress
            </h2>
            <Link
              href="/tasks"
              className="text-xs font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors hover:underline"
            >
              View all challenges
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ACTIVE CHALLENGE CARD */}
            <Link href="/tasks" className="block cursor-pointer">
              <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl flex items-center gap-4 hover:border-white/15 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <svg
                    className="w-6 h-6 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15a7 7 0 007-7V4H5v4a7 7 0 007 7zm0 0v4m0 0H8m4 0h4m-9-8H3m18 0h-2"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">
                    Available Challenge:
                  </span>
                  <h3 className="text-sm font-extrabold text-white truncate">
                    The Opener
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-gradient-to-r from-[#06b6d4] to-[#4F46E5] h-full rounded-full w-[45%]" />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    Description: Complete your first arena match.
                  </p>
                </div>
              </div>
            </Link>

            {/* LOCKED CHALLENGE CARD 1 */}
            <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-2xl flex items-center gap-4 hover:border-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] z-10">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0 filter blur-[2.5px] select-none z-10">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Locked Challenge
                </span>
                <h3 className="text-sm font-extrabold text-slate-400">
                  Tactical Drill
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Description: Complete your first arena match.
                </p>
              </div>

              {/* Large Glass Lock SVG on the right */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none z-0">
                <svg
                  className="w-18 h-18 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
            </div>

            {/* LOCKED CHALLENGE CARD 2 */}
            <div className="bg-gradient-to-b from-[#131927]/90 to-[#0d101d]/90 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md shadow-2xl flex items-center gap-4 hover:border-white/15 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.15)] z-10">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0 filter blur-[2.5px] select-none z-10">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Locked Challenge
                </span>
                <h3 className="text-sm font-extrabold text-slate-400">
                  Squad Dominator
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Description: Complete your first arena match.
                </p>
              </div>

              {/* Large Glass Lock SVG on the right */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none z-0">
                <svg
                  className="w-18 h-18 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
