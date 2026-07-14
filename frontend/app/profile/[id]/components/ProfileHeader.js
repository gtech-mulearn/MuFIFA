import React from "react";
import Link from "next/link";

export default function ProfileHeader({ copiedShare, handleShareProfile }) {
  return (
    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-6 md:px-8 mt-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
          PLAYER <span className="text-[#8B5CF6]">PROFILE</span>
        </h1>
        <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-400">
          <Link
            href="/dashboard"
            className="hover:text-white transition-colors"
          >
            Home
          </Link>
          <span className="text-slate-600 px-1">&gt;</span>
          <span className="text-slate-300">Profile</span>
        </div>
      </div>

      <button
        onClick={handleShareProfile}
        className="cursor-pointer px-4 py-2 bg-white/5 border border-white/10 hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/10 rounded-xl text-xs font-semibold tracking-wide text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-lg"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.343-2.73m-5.343 2.73l5.34 2.73m0 0a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185zm-.007-12.75a2.25 2.25 0 103.933-2.184 2.25 2.25 0 00-3.933 2.184z"
          />
        </svg>
        {copiedShare ? "Copied Link!" : "Share Profile"}
      </button>
    </div>
  );
}
