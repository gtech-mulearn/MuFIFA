import React from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function ProfileBanner({
  player,
  equippedFrame,
  isOwner,
  uploading,
  handleAvatarChange,
  level,
  xpInLevel,
  nextXp,
  downloadingCard,
  handleDownloadCard,
  currentUser,
  openModalWithTab,
  bannerBg,
  countryCode,
}) {
  return (
    <div className="relative overflow-hidden rounded-none sm:rounded-3xl border border-white/8 bg-[#090715]/40 backdrop-blur-md p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
      {/* Custom Banner Flag Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.35] pointer-events-none"
        style={{ backgroundImage: `url('${bannerBg}')` }}
      />
      {/* Soccer Field Lines Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.20] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: `url('/bg_img.webp')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0724]/90 via-[#0a0c16]/80 to-[#0b061d]/90 z-0 pointer-events-none" />

      {/* Banner Left Details */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="relative">
          <Avatar
            avatarUrl={player.avatar_url}
            name={player.name}
            equippedFrame={equippedFrame}
            sizeClass="w-24 h-24"
            initialsSizeClass="text-3xl"
            borderClass="bg-gradient-to-tr from-[#8B5CF6] via-transparent to-[#06B6D4] p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.45)]"
          />

          {isOwner && (
            <label
              htmlFor="banner-avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center rounded-full cursor-pointer shadow-lg border-2 border-[#090715] transition-all transform hover:scale-110 active:scale-95"
              title="Edit Avatar"
            >
              {uploading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              )}
              <input
                id="banner-avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-extrabold tracking-wide text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
              {player.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-1 text-xs text-slate-300">
            {player.team && (
              <span className="font-semibold flex items-center gap-1.5">
                <span
                  className={`fi fi-${countryCode} rounded-sm shadow-sm scale-110`}
                />
                {player.team}
              </span>
            )}
            {player.institutions && (
              <>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="font-medium text-slate-400">
                  {player.institutions}
                </span>
              </>
            )}
            {player.role && player.role !== "player" && (
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  player.role === "captain"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                }`}
              >
                {player.role === "captain" ? "Captain" : "Vice Captain"}
              </span>
            )}
            <span
              className="w-4 h-4 bg-violet-600/95 text-white flex items-center justify-center rounded-full text-[9px] font-black shadow-md shadow-violet-600/30"
              title="Verified Player"
            >
              ✓
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
            <div className="flex items-center gap-2 bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 rounded-full px-3 py-0.5">
              <span className="text-[10px] font-black uppercase text-[#a78bfa] tracking-wider">
                LVL {level}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {xpInLevel} / {nextXp > 0 ? nextXp : "MAX"} XP
            </span>
          </div>
        </div>
      </div>

      {/* Banner Right Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-center shrink-0">
        <button
          onClick={handleDownloadCard}
          className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs font-semibold tracking-wide text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {downloadingCard ? "Generating..." : "Download Card"}
        </button>

        {currentUser &&
          (currentUser.role === "captain" ||
            currentUser.role === "vicecaptain") && (
            <Link
              href="/captain"
              className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-xl text-xs font-semibold tracking-wide text-violet-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
            >
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3L16 7L21 4L19 16H5L3 4L8 7L12 3Z"
                />
              </svg>
              Captain Room
            </Link>
          )}

        {isOwner && (
          <button
            onClick={() => openModalWithTab("profile")}
            className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
