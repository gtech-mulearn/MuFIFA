import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ChallengeModal({
  isOpen,
  onClose,
  task,
  onVerify,
  verifyingTaskId,
  verifyError,
  verifySuccess,
}) {

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!task) return null;

  // Map task ID to playercard badge logos
  const getTaskLogo = (taskId) => {
    const logos = [
      "/playerCard/badge/Object.webp", // 0
      "/playerCard/badge/Object.webp", // 1 (referral)
      "/playerCard/badge/Object-6.webp", // 2 (creativity)
      "/playerCard/badge/Object-1.webp", // 3 (pencil)
      "/playerCard/badge/Object-4.webp", // 4 (innovation)
      "/playerCard/badge/Object-2.webp", // 5 (star)
      "/playerCard/badge/Object-3.webp", // 6 (teamwork)
      "/playerCard/badge/Object-7.webp", // 7 (execution)
      "/playerCard/badge/Object-5.webp", // 8 (branding)
    ];
    return (
      logos[taskId] ||
      logos[taskId % logos.length] ||
      "/playerCard/badge/Object.webp"
    );
  };

  const xpValue = task.mupoint > 0 ? task.mupoint * 10 : 50;

  return (
    <div
      className={`challenge-modal-fixed-wrapper ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"
      />

      {/* Floating Close Button at top right of the modal (fixed in place above scroll) */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/10 hover:border-white/20 bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 transition-all cursor-pointer z-30 shadow-md"
        title="Close"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Sliding Content Container */}
      <div
        className={`absolute inset-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-[#0c0a18] md:bg-transparent transition-transform duration-500 ease-out z-10 ${
          isOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
        }`}
      >
        {/* Left Panel: Slides in from left on desktop, static stack on mobile */}
        <div className={`md:absolute md:left-0 md:top-0 md:bottom-0 md:w-1/2 w-full md:h-full h-auto bg-gradient-to-br from-[#1b1544] via-[#0f0b27] to-[#04030a] p-6 py-10 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0 select-none transition-transform duration-500 ease-out z-10 ${
          isOpen ? "md:translate-x-0" : "md:-translate-x-full"
        }`}>
        {/* Stadium BG pattern */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.15] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        {/* Glow */}
        <div className="absolute w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col items-center text-center gap-4 md:gap-8">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-violet-400">
            Challenge Reward
          </span>

          {/* Logo Badge (Playercard Badge) */}
          <div className="relative w-24 h-24 md:w-36 md:h-36 shrink-0 flex items-center justify-center">
            <div className="absolute -inset-1 md:-inset-1.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 blur opacity-45 animate-pulse" />
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-[#121021] border border-violet-500/30 flex items-center justify-center shadow-2xl relative z-10">
              <div className="relative w-12 h-12 md:w-18 md:h-18">
                <Image
                  src={getTaskLogo(task.id)}
                  alt="Logo Badge"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
                />
              </div>
            </div>
          </div>

          {/* Reward breakdown values */}
          <div className="flex flex-row gap-3 md:gap-4 mt-1 md:mt-2 justify-center items-center">
            {/* points */}
            <div className="bg-[#120e2b]/80 border border-violet-500/15 rounded-2xl p-3 md:p-5 flex flex-col items-center justify-center shadow-lg w-28 md:w-36 select-none">
              <span className="text-2xl md:text-3xl font-black text-amber-400 leading-none">
                +{task.mupoint || 0}
              </span>
              <span className="text-[8px] md:text-[10px] font-black tracking-widest text-slate-400 mt-1 md:mt-2">
                μPoints
              </span>
            </div>

            {/* XP */}
            <div className="bg-[#120e2b]/80 border border-violet-500/15 rounded-2xl p-3 md:p-5 flex flex-col items-center justify-center shadow-lg w-28 md:w-36 select-none">
              <span className="text-2xl md:text-3xl font-black text-violet-400 leading-none">
                +{xpValue}
              </span>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 md:mt-2">
                XP Points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Slides in from right on desktop, static stack on mobile */}
      <div
        className={`md:absolute md:right-0 md:top-0 md:bottom-0 md:w-1/2 w-full md:h-full h-auto p-6 pb-24 md:p-12 flex flex-col justify-between md:overflow-y-auto bg-[#0c0a18]/95 backdrop-blur-md transition-transform duration-500 ease-out z-10 ${
          isOpen ? "md:translate-x-0" : "md:translate-x-full"
        }`}
      >

        <div className="flex flex-col gap-8 text-left pr-2 mt-4 md:mt-8">
          {/* Header detail */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
                Tier {task.tier}
              </span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Challenge {task.id}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider leading-tight">
              {task.title}
            </h2>
          </div>

          {/* Guidelines */}
          <div className="flex flex-col gap-4">
            <span className="text-sm font-black uppercase tracking-[0.25em] text-violet-400 border-b border-white/5 pb-2.5">
              GUIDELINES & CRITERIA
            </span>
            <div className="guidelines-content text-base text-slate-200 leading-relaxed font-semibold space-y-4 max-h-none md:max-h-[300px] overflow-y-visible md:overflow-y-auto pr-2 custom-scrollbar">
              {task.longDesc}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-black uppercase tracking-[0.25em] text-amber-500 border-b border-white/5 pb-2.5">
              STATUS
            </span>
            {task.completed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span>Completed - Reward Claimed</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
                  <span>Progress</span>
                  <span>
                    {task.completed ? "1/1" : "0/1"}
                  </span>
                </div>
                <div className="w-full bg-[#151225] h-2 rounded-full overflow-hidden">
                  <div className={`bg-violet-500 h-full rounded-full transition-all duration-500 ${task.completed ? "w-full" : "w-0"}`} />
                </div>
              </div>
            )}
          </div>



          {/* Verification output feedback messages */}
          {verifyError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold py-2.5 px-4 rounded-xl text-center w-full">
              {verifyError}
            </div>
          )}
          {verifySuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold py-2.5 px-4 rounded-xl text-center w-full">
              {verifySuccess}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-white/5">
          {task.id !== 3 && (
            <button
              onClick={() => onVerify(task)}
              disabled={verifyingTaskId === task.id || task.completed}
              className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {verifyingTaskId === task.id ? (
                <span>VERIFYING...</span>
              ) : task.completed ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span>VERIFIED</span>
                </>
              ) : (
                <span>VERIFY TASK</span>
              )}
            </button>
          )}

          <Link
            href={task.actionUrl}
            className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{task.actionLabel}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}
