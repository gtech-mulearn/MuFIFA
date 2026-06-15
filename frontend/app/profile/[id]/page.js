"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CountdownSkeleton } from "@/components/CountdownSection";
import { TEAM_WHATSAPP_LINKS, TEAM_FLAGS } from "@/utils/constants";

const CountdownSection = dynamic(
  () => import("@/components/CountdownSection"),
  {
    ssr: false,
    loading: () => <CountdownSkeleton />,
  },
);

const DOMAIN_STYLES = {
  Coder: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  Creative: "bg-pink-500/10 border-pink-500/30 text-pink-400",
  Strategist: "bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]",
  Maker: "bg-[#4F46E5]/10 border-[#4F46E5]/30 text-[#4F46E5]",
};

export default function ProfilePage({ params }) {
  const router = useRouter();
  // Unwrap Next.js 15+ promise-based params
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [player, setPlayer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        setCurrentUser(null);
        router.push("/");
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function fetchProfileAndAuth() {
      try {
        // Fetch profile
        const profileRes = await fetch(
          `/api/v1/profile/${encodeURIComponent(id)}`,
        );
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.success) {
          setError(profileData.error?.message || "Profile not found.");
          setLoading(false);
          return;
        }

        setPlayer(profileData.data);

        // Fetch current auth user to check ownership
        const authRes = await fetch("/api/v1/auth/me");
        const authData = await authRes.json();
        if (authRes.ok && authData.success) {
          setCurrentUser(authData.data);
        }
      } catch (err) {
        console.error("Error fetching player profile/auth:", err);
        setError("Unable to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndAuth();
  }, [id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side verification
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, WEBP, and GIF images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Image must be under 3MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to upload avatar.");
        return;
      }

      // Update states
      setPlayer((prev) => ({ ...prev, avatar_url: data.avatar_url }));
    } catch (err) {
      console.error("Avatar upload error:", err);
      setUploadError("A connection error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Extract initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return "⚽";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isOwner = currentUser && player && currentUser.id === player.id;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12 overflow-hidden">
      {/* Decorative Gradients & Glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06)_0%,#090A0F_80%)] pointer-events-none no-print" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#090A0F] via-transparent to-[rgba(6,182,212,0.06)] pointer-events-none no-print" />
      <div className="absolute top-[10%] right-[5%] w-[55vw] h-[55vw] bg-[#4f46e5]/8 pointer-events-none rounded-full blur-[130px] no-print" />
      <div className="absolute bottom-[10%] left-[-10%] w-[55vw] h-[55vw] bg-[#06b6d4]/8 pointer-events-none rounded-full blur-[130px] no-print" />

      {/* Honeycomb Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='32' viewBox='0 0 56 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0 L56 16 L56 32 L28 32 L0 32 L0 16 Z M0 0 L28 16 L56 0' fill='none' stroke='%23ffffff' stroke-width='1.2'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Left Wavy Glow Path */}
      <svg
        className="absolute left-0 top-[20%] w-[250px] h-[500px] pointer-events-none opacity-20 hidden md:block"
        viewBox="0 0 100 500"
      >
        <path
          d="M 0 450 Q 50 350 20 250 T 80 50"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M 0 430 Q 40 340 10 240 T 70 40"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      {/* Right Wavy Glow Path */}
      <svg
        className="absolute right-0 top-[15%] w-[250px] h-[500px] pointer-events-none opacity-20 hidden md:block"
        viewBox="0 0 100 500"
      >
        <path
          d="M 100 50 Q 50 150 80 250 T 20 450"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M 100 70 Q 60 160 90 260 T 30 430"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center gap-6">
        {error || !player ? (
          /* NOT FOUND / ERROR CARD */
          <div className="w-full max-w-md bg-glass-card rounded-2xl p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 text-center bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79,70,229,0.015))]">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-200">
                Profile Not Found
              </h2>
              <p className="text-xs text-slate-400">
                {error ||
                  "The requested player profile could not be found. Make sure the ID or Player ID is correct."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/leaderboard"
                className="flex-1 text-center py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-xs font-bold uppercase tracking-wider transition-colors bg-white/5"
              >
                Leaderboard
              </Link>
              <Link
                href="/"
                className="flex-1 text-center py-2.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Back to Lobby
              </Link>
            </div>
          </div>
        ) : (
          /* PLAYER PROFILE & TICKET CARD */
          <div className="w-full max-w-md flex flex-col gap-6 items-center">
            {/* Header Navigation */}
            <div className="w-full flex justify-between items-center px-1 no-print">
              <div className="flex gap-2">
                <Link
                  href="/leaderboard"
                  className="px-3.5 py-2 rounded-xl bg-glass border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  ← Leaderboard
                </Link>
                <button
                  onClick={() => window.print()}
                  className="cursor-pointer px-3 py-2 rounded-xl bg-glass border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                  title="Print Pass"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.865 48.865 0 0 0-14.326 0C3.768 7.44 3 8.375 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M12 10.5h.008v.008H12V10.5Zm3 0h.008v.008H15V10.5ZM9 10.5h.008v.008H9V10.5ZM18 13.5h.008v.008H18V13.5ZM6 13.5h.008v.008H6V13.5M16.5 7.5v-3a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3v3m6 0h-6"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="px-3.5 py-2 rounded-xl bg-glass border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                >
                  Lobby
                </Link>
                {isOwner && (
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-glass border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>

            {/* Arena Countdown */}
            <div className="w-full flex flex-col items-center justify-center py-3.5 px-4 bg-black/40 border border-white/10 rounded-3xl backdrop-blur-md shadow-lg relative overflow-hidden bg-[linear-gradient(115deg,rgba(255,255,255,0.01),rgba(79,70,229,0.005))] no-print">
              <span className="text-[9px] tracking-widest text-[#4F46E5] font-black uppercase mb-2">
                Arena Battle Commences In
              </span>
              <CountdownSection />
            </div>

            {/* Combined Ticket & Profile Pass Card */}
            <div
              id="tournament-ticket"
              className="w-full bg-[#131927]/95 border-2 border-dashed border-[#06B6D4]/40 rounded-3xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-6 relative overflow-hidden backdrop-blur-lg select-none"
            >
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#06B6D4]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-[#4F46E5]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Side notched circles for physical ticket look */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-[10px] w-5 h-5 bg-[#090A0F] border-r-2 border-dashed border-[#06B6D4]/40 rounded-full no-print" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-[10px] w-5 h-5 bg-[#090A0F] border-l-2 border-dashed border-[#06B6D4]/40 rounded-full no-print" />

              {/* Ticket Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <Image
                      src="/trophy.png"
                      alt="World Cup Trophy"
                      width={9}
                      height={24}
                      priority
                      className="h-5 sm:h-6 w-auto object-contain filter drop-shadow-[0_0_6px_rgba(6,182,212,0.45)]"
                    />
                    <Image
                      src="/logo.png"
                      alt="μLearn Logo"
                      width={53}
                      height={24}
                      priority
                      className="h-5 sm:h-6 w-auto object-contain"
                    />
                  </div>
                  <div className="h-5 sm:h-6 w-[1px] bg-white/20 mx-0.5" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] sm:text-[11px] font-black tracking-wider text-slate-100 uppercase leading-tight mt-0.5">
                      Arena Access Pass
                    </span>
                  </div>
                </div>
                <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-1.5 sm:px-2 py-0.5 rounded text-[7px] sm:text-[8px] font-black text-[#06B6D4] tracking-wider uppercase shrink-0">
                  CONFIRMED
                </div>
              </div>

              {/* Avatar, Name & Player ID details */}
              <div className="flex flex-col items-center gap-3 border-b border-white/5 pb-5 pt-1">
                <div className="relative group">
                  <div className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] p-[2.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#131927] flex items-center justify-center font-extrabold text-xl text-slate-100 uppercase tracking-wider">
                        {getInitials(player.name)}
                      </div>
                    )}

                    {isOwner && (
                      <label
                        htmlFor="avatar-upload-input"
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-bold"
                      >
                        {uploading ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <span className="mt-0.5">Edit DP</span>
                        )}
                        <input
                          id="avatar-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>

                  {TEAM_FLAGS[player.team] && (
                    <div
                      className="absolute bottom-0 right-0 w-5.5 h-5.5 rounded-full border-2 border-[#131927] bg-[#131927] shadow-md flex items-center justify-center overflow-hidden"
                      style={{ transform: "translate(15%, 15%)" }}
                    >
                      <span
                        className={`fi fi-${TEAM_FLAGS[player.team]} scale-125`}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                <div className="text-center flex flex-col gap-0.5">
                  <h2 className="text-base sm:text-lg font-extrabold tracking-wide text-slate-100">
                    {player.name}
                  </h2>
                  <span className="text-xs font-bold text-[#06B6D4] tracking-wider">
                    @{player.user_id}
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] py-1.5 px-3 rounded-xl font-semibold text-center no-print">
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                <div className="flex flex-col text-left gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Selected Team
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                    {player.team}
                  </span>
                </div>
                <div className="flex flex-col text-left gap-0.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Squad Domain
                  </span>
                  <div>
                    <span
                      className={`inline-block border px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider leading-none ${DOMAIN_STYLES[player.domain] || "bg-white/5 border-white/10 text-white"}`}
                    >
                      {player.domain}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Footer (Issued On and Score) */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col text-left gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">
                    Issued On
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {new Date(
                      player.created_at || Date.now(),
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex flex-col text-right gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">
                    Current Score
                  </span>
                  <span className="text-[12px] font-black text-[#06B6D4] tracking-wider">
                    {player.mu_points || 0} μPoints
                  </span>
                </div>
              </div>
            </div>

            {/* Squad WhatsApp Joining CTA (Only visible to owner, no-print) */}
            {isOwner && (
              <div className="flex flex-col gap-3 w-full max-w-sm justify-center no-print mt-1">
                <a
                  href={
                    TEAM_WHATSAPP_LINKS[player.team] ||
                    "https://chat.whatsapp.com/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer bg-[#25D366] text-white hover:bg-[#20ba5a] px-6 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_35px_rgba(37,211,102,0.45)] transform hover:-translate-y-0.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    className="w-4 h-4 fill-current"
                  >
                    <path d="M16.004 3C8.82 3 3 8.82 3 16.004c0 2.293.598 4.532 1.734 6.504L3 29l6.676-1.706a12.95 12.95 0 0 0 6.328 1.636C23.18 28.93 29 23.11 29 15.926 29 8.82 23.18 3 16.004 3zm0 23.798a10.74 10.74 0 0 1-5.47-1.496l-.392-.232-3.96 1.01 1.056-3.86-.254-.4a10.72 10.72 0 0 1-1.646-5.816c0-5.94 4.83-10.77 10.766-10.77 2.878 0 5.584 1.12 7.617 3.154a10.69 10.69 0 0 1 3.148 7.612c0 5.94-4.83 10.798-10.766 10.798zm5.906-8.052c-.322-.16-1.904-.94-2.198-1.046-.294-.106-.508-.16-.722.16-.214.32-.83 1.046-1.018 1.26-.186.214-.374.24-.694.08-.32-.16-1.35-.498-2.572-1.586-.95-.846-1.59-1.89-1.776-2.21-.188-.32-.02-.492.14-.65.144-.144.32-.374.48-.56.16-.188.214-.32.32-.534.106-.214.054-.4-.026-.56-.08-.16-.722-1.74-.99-2.386-.26-.626-.524-.54-.722-.55l-.614-.01c-.214 0-.56.08-.854.4-.294.32-1.122 1.096-1.122 2.674 0 1.578 1.15 3.102 1.31 3.316.16.214 2.262 3.454 5.48 4.842.766.33 1.364.526 1.83.674.77.244 1.47.21 2.024.128.618-.092 1.904-.778 2.172-1.53.268-.752.268-1.396.188-1.53-.08-.132-.294-.212-.616-.372z" />
                  </svg>
                  <span>Join {player.team} WhatsApp Group</span>
                </a>
              </div>
            )}

            <Link
              href="/leaderboard"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-black no-print mt-2"
            >
              Return to Standing Board
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
