"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/tasks/components/Header/Header";
import { usePlayer } from "@/components/PlayerContext";
import { calculateLevel } from "@/utils/constants";

export default function RewardsPage() {
  const { player, loading: playerLoading, refreshPlayer } = usePlayer();

  const [rewards, setRewards] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  // Modal State
  const [selectedRewardForModal, setSelectedRewardForModal] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [modalActiveTab, setModalActiveTab] = useState("description");

  const closeModal = useCallback(() => {
    setIsRewardModalOpen(false);
    setTimeout(() => {
      setSelectedRewardForModal(null);
    }, 500);
  }, []);

  // Calculate player level and points details
  const xp = player?.xp_breakdown || {};
  const totalXp =
    (xp.creativity || 0) +
    (xp.branding || 0) +
    (xp.innovation || 0) +
    (xp.teamwork || 0) +
    (xp.execution || 0);
  
  const levelData = calculateLevel(totalXp);
  const level = player ? levelData.level : 1;
  const xpInLevel = player ? levelData.currentLevelXp : 0;
  const nextXp = levelData.nextXp;
  const xpPercent = player ? levelData.xpPercent : 0;
  const muPoints = player?.mu_points || 0;

  // Fetch paginated rewards
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/rewards?page=${page}&limit=6`);
      const data = await res.json();
      if (data.success) {
        setRewards(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError(data.error || "Failed to load rewards.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch rewards from server.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    if (isRewardModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRewardModalOpen, closeModal]);

  // Sync modal state if rewards are updated (e.g. after a claim)
  useEffect(() => {
    if (selectedRewardForModal) {
      const updated = rewards.find((r) => r.id === selectedRewardForModal.id);
      if (updated) {
        setSelectedRewardForModal(updated);
      }
    }
  }, [rewards, selectedRewardForModal]);

  // Reset active image index and tab on modal item change
  useEffect(() => {
    setActiveImageIdx(0);
    setModalActiveTab("description");
  }, [selectedRewardForModal?.id]);

  // Flash messages helper
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 5000);
  };

  // Claim reward handler
  const handleClaim = async (itemId, title) => {
    if (!player) {
      setError("Please sign in to claim rewards.");
      return;
    }

    if (!window.confirm(`Are you sure you want to claim "${title}"?`)) {
      return;
    }

    setClaimingId(itemId);
    setError("");
    try {
      const res = await fetch("/api/v1/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ merch_id: itemId }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(
          `Successfully claimed "${title}"! Check your profile or email for instructions.`,
        );
        // Refresh player context data to update their level/points in the header/dashboard
        if (refreshPlayer) refreshPlayer();
        // Reload current page to update claim statuses & quantities
        fetchRewards();
      } else {
        setError(data.error || "Failed to claim reward.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while claiming.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-12 px-4 sm:px-6 md:px-8 text-white min-h-screen">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.22] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/80 via-[#030207]/75 to-[#030207]/90 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[15%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.05)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Header Panel */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10 mt-4">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.20] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/40 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <Header
              title="REWARDS"
              highlightedTitle="MARKETPLACE"
              subtitle="Unlock exclusive merchandise sponsoring real-world prizes and premium cosmetics."
            />
          </div>

          {/* Player Eligibility Summary Widget */}
          {!playerLoading && (
            <div className="w-full md:w-80 bg-[#120f26]/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col gap-3 shrink-0 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-violet-600/10 blur-xl pointer-events-none" />
              {player ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Player Standing
                    </span>
                    <Link
                      href={`/profile/${player.user_id}`}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-bold tracking-wide cursor-pointer"
                    >
                      View Profile →
                    </Link>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold">
                        LEVEL
                      </span>
                      <span className="text-2xl font-black text-white leading-none mt-1">
                        {level}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-500 font-bold">
                        BALANCES
                      </span>
                      <span className="text-xl font-black text-amber-400 leading-none mt-1 flex items-center gap-1">
                        {muPoints}
                        <span className="text-[8px] font-bold text-slate-400">
                          μPts
                        </span>
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                      <span>XP Progress</span>
                      {nextXp > 0 ? (
                        <span>{xpInLevel} / {nextXp} XP</span>
                      ) : (
                        <span>MAX LEVEL</span>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-2 text-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">
                    Unlock Arcade Rewards
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Sign in to track your level, earn points, and claim
                    exclusive gear for free.
                  </p>
                  <div className="flex gap-2 mt-1.5 w-full">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-1.5 bg-white text-black font-black text-[10px] tracking-wider rounded-lg hover:bg-slate-100 transition-colors uppercase cursor-pointer"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-1.5 border border-white/20 hover:border-white text-white font-black text-[10px] tracking-wider rounded-lg hover:bg-white/5 transition-colors uppercase cursor-pointer"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages / Banners */}
      {error && (
        <div className="relative z-10 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs py-3 px-4 rounded-2xl flex items-center justify-between shadow-lg animate-fadeIn">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-rose-300 font-bold hover:opacity-80 text-sm"
          >
            ×
          </button>
        </div>
      )}
      {successMsg && (
        <div className="relative z-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs py-3 px-4 rounded-2xl flex items-center justify-between shadow-lg animate-fadeIn">
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-300 font-bold hover:opacity-80 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid Container */}
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
            Available Rewards
          </h2>
          <span className="text-[10px] text-slate-400 font-bold bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
            Sponsor Merch Store:{" "}
            <a
              href="https://www.zycoz.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-extrabold ml-0.5"
            >
              Zycoz
            </a>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-white/5 bg-[#090715]/20 rounded-2xl text-slate-400 gap-2">
            <svg
              className="w-8 h-8 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            <span className="text-xs">
              No active rewards available at the moment. Check back later!
            </span>
          </div>
        ) : (
          /* Responsive 3 columns grid on desktop */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((item) => {
              const claimed = !!item.claimed;
              const outOfStock = item.quantity <= 0;
              const levelEligible = level >= item.min_level;
              const pointsEligible = muPoints >= item.min_points;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedRewardForModal(item);
                    setIsRewardModalOpen(true);
                  }}
                  className="bg-gradient-to-b from-[#110e24]/90 to-[#070613]/90 border border-white/10 hover:border-violet-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between select-none group min-h-[340px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(139,92,246,0.15)] cursor-pointer"
                >
                  {/* Card Content Top */}
                  <div className="flex flex-col text-left">
                    {/* Image Box - full cover, no padding, category tag removed, overlay badges */}
                    <div className="relative w-full h-40 mb-4 flex items-center justify-center rounded-xl overflow-hidden bg-slate-900/50 border border-white/5 group-hover:border-white/10 transition-colors">
                      {item.image_url ? (
                        <img
                          src={item.image_url.split(",")[0].trim()}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-violet-500/30 group-hover:text-violet-500/40 transition-colors">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625A2.625 2.625 0 1114.625 7.5H12m0-2.625V7.5m-9 0h18a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V9A1.5 1.5 0 013 7.5z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Status Overlays */}
                      {outOfStock && (
                        <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-900/30 px-2 py-0.5 rounded z-10 backdrop-blur-sm">
                          Out of Stock
                        </span>
                      )}
                      {!outOfStock && claimed && (
                        <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-900/30 px-2 py-0.5 rounded z-10 backdrop-blur-sm">
                          Claimed
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black tracking-wide uppercase leading-tight text-white line-clamp-1 group-hover:text-violet-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1.5 line-clamp-2 h-8">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  {/* Card Bottom Area */}
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5">
                    {/* Requirements Display */}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold">
                        Arcade Requirements
                      </span>
                      <div className="flex gap-2">
                        <span
                          className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                            !player
                              ? "text-slate-400 bg-white/5"
                              : levelEligible
                                ? "text-emerald-400 bg-emerald-950/20"
                                : "text-amber-400 bg-amber-950/20"
                          }`}
                        >
                          Lvl {item.min_level}
                        </span>
                        <span
                          className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                            !player
                              ? "text-slate-400 bg-white/5"
                              : pointsEligible
                                ? "text-emerald-400 bg-emerald-950/20"
                                : "text-amber-400 bg-amber-950/20"
                          }`}
                        >
                          {item.min_points} μPts
                        </span>
                      </div>
                    </div>

                    {/* View Details Store Button (Matches challenges view details layout) */}
                    <div className="mt-2 pt-0.5">
                      <div
                        className={`w-full py-2.5 text-[9px] font-black tracking-widest uppercase rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          claimed
                            ? "bg-[#0b2416] border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/15"
                            : outOfStock
                              ? "bg-[#240b0b] border-rose-500/25 text-rose-400 group-hover:bg-rose-500/15"
                              : "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md group-hover:from-violet-500 group-hover:to-indigo-500"
                        }`}
                      >
                        <span>
                          {claimed
                            ? "Claimed (View)"
                            : outOfStock
                              ? "Out of Stock"
                              : "View Details"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 select-none"
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Previous
            </button>
            <span className="text-xs font-mono text-slate-400">
              Page <span className="font-bold text-white">{page}</span> of{" "}
              <span className="font-bold text-white">
                {pagination.totalPages}
              </span>
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 select-none"
            >
              Next
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
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Reward Detail Modal - Display images on left and content on right */}
      {selectedRewardForModal && (
        <div
          className={`challenge-modal-fixed-wrapper transition-all duration-500 ease-in-out ${
            isRewardModalOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          style={{ transitionDuration: "500ms" }}
        >
          {/* Backdrop overlay */}
          <div
            onClick={closeModal}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"
          />

          {/* Floating Close Button */}
          <button
            onClick={closeModal}
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
              isRewardModalOpen
                ? "translate-y-0"
                : "translate-y-full md:translate-y-0"
            }`}
          >
            {/* Left Panel: Image and Requirements */}
            <div
              className={`md:absolute md:left-0 md:top-0 md:bottom-0 md:w-1/2 w-full md:h-full h-auto bg-[#090715] p-6 py-10 md:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0 select-none transition-transform duration-500 ease-out z-10 ${
                isRewardModalOpen ? "md:translate-x-0" : "md:-translate-x-full"
              }`}
            >
              <div className="relative z-10 flex flex-col items-center text-center gap-4 md:gap-6 w-full max-w-sm">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-violet-400">
                  Arcade Merchandise
                </span>

                {/* Merchandise Image Carousel (Focused & Borderless) */}
                <div className="relative w-full h-64 md:h-80 shrink-0 flex items-center justify-center overflow-hidden group/modalimg">
                  {(() => {
                    const imageUrls = selectedRewardForModal.image_url
                      ? selectedRewardForModal.image_url
                          .split(",")
                          .map((u) => u.trim())
                          .filter(Boolean)
                      : [];

                    if (imageUrls.length === 0) {
                      return (
                        <div className="text-violet-500/40 relative z-10">
                          <svg
                            className="w-20 h-20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625A2.625 2.625 0 1114.625 7.5H12m0-2.625V7.5m-9 0h18a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V9A1.5 1.5 0 013 7.5z"
                            />
                          </svg>
                        </div>
                      );
                    }

                    const currentImage =
                      imageUrls[activeImageIdx] || imageUrls[0];

                    return (
                      <>
                        <img
                          src={currentImage}
                          alt={selectedRewardForModal.title}
                          className="max-h-[95%] max-w-[95%] object-contain relative z-10 drop-shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-[1.02]"
                        />

                        {/* Carousel Arrows */}
                        {imageUrls.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIdx((prev) =>
                                  prev === 0 ? imageUrls.length - 1 : prev - 1,
                                );
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 flex items-center justify-center text-white hover:scale-110 transition-all z-20 cursor-pointer shadow-md opacity-0 group-hover/modalimg:opacity-100"
                              title="Previous Image"
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
                                  d="M15.75 19.5L8.25 12l7.5-7.5"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIdx((prev) =>
                                  prev === imageUrls.length - 1 ? 0 : prev + 1,
                                );
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 flex items-center justify-center text-white hover:scale-110 transition-all z-20 cursor-pointer shadow-md opacity-0 group-hover/modalimg:opacity-100"
                              title="Next Image"
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
                                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                />
                              </svg>
                            </button>

                            {/* Dot Indicators */}
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                              {imageUrls.map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIdx(idx);
                                  }}
                                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                    idx === activeImageIdx
                                      ? "bg-violet-400 w-3 shadow-[0_0_8px_#8b5cf6]"
                                      : "bg-white/40 hover:bg-white/60"
                                  }`}
                                  aria-label={`Go to slide ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Horizontal Thumbnails Row */}
                {(() => {
                  const imageUrls = selectedRewardForModal.image_url
                    ? selectedRewardForModal.image_url
                        .split(",")
                        .map((u) => u.trim())
                        .filter(Boolean)
                    : [];
                  if (imageUrls.length <= 1) return null;
                  return (
                    <div className="flex gap-2.5 overflow-x-auto justify-center py-1 w-full max-w-sm scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                      {imageUrls.map((url, idx) => (
                        <button
                          key={url + idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx(idx);
                          }}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 bg-slate-900 flex-shrink-0 transition-all cursor-pointer ${
                            idx === activeImageIdx
                              ? "border-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)] scale-105"
                              : "border-white/10 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Requirements Display */}
                <div className="flex flex-row gap-3 md:gap-4 mt-2 justify-center items-center w-full">
                  {/* Min Level Requirement */}
                  <div className="bg-[#120e2b]/85 border border-violet-500/15 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center shadow-lg flex-1 select-none">
                    <span className="text-lg md:text-2xl font-black text-violet-400 leading-none">
                      Level {selectedRewardForModal.min_level}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-black tracking-widest text-slate-400 mt-1 uppercase">
                      Min Requirement
                    </span>
                  </div>

                  {/* Min Points Requirement */}
                  <div className="bg-[#120e2b]/85 border border-violet-500/15 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center shadow-lg flex-1 select-none">
                    <span className="text-lg md:text-2xl font-black text-amber-400 leading-none">
                      {selectedRewardForModal.min_points}
                    </span>
                    <span className="text-[8px] md:text-[9px] font-black tracking-widest text-slate-400 mt-1 uppercase">
                      μPoints Cost
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Content details */}
            <div
              className={`md:absolute md:right-0 md:top-0 md:bottom-0 md:w-1/2 w-full md:h-full h-auto p-6 pb-24 md:p-12 flex flex-col justify-between md:overflow-y-auto bg-[#0c0a18]/95 backdrop-blur-md transition-transform duration-500 ease-out z-10 ${
                isRewardModalOpen ? "md:translate-x-0" : "md:translate-x-full"
              }`}
            >
              <div className="flex flex-col gap-6 text-left pr-2 mt-4 md:mt-8">
                {/* Title and Tag */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                      {selectedRewardForModal.tag || "Merchandise"}
                    </span>
                    {selectedRewardForModal.quantity <= 0 && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded animate-pulse">
                        Out of Stock
                      </span>
                    )}
                    {selectedRewardForModal.claimed && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Claimed ✓
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight mt-1.5">
                    {selectedRewardForModal.title}
                  </h2>

                  {/* Claims E-commerce Row */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
                      {((selectedRewardForModal.id * 13) % 50) + 20} Claims
                    </span>
                  </div>
                </div>

                {/* Stock Status details */}
                <div className="flex items-center gap-2 bg-white/3 border border-white/5 px-3 py-2 rounded-xl w-fit">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedRewardForModal.quantity > 5
                        ? "bg-emerald-400 animate-pulse"
                        : selectedRewardForModal.quantity > 0
                          ? "bg-amber-400 animate-pulse"
                          : "bg-rose-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    {selectedRewardForModal.quantity > 5 ? (
                      <span>
                        In Stock{" "}
                        <span className="text-slate-400 font-normal">
                          ({selectedRewardForModal.quantity} units)
                        </span>
                      </span>
                    ) : selectedRewardForModal.quantity > 0 ? (
                      <span className="text-amber-400">
                        Only {selectedRewardForModal.quantity} units left!
                      </span>
                    ) : (
                      <span className="text-rose-400">
                        Temporarily Out of Stock
                      </span>
                    )}
                  </span>
                </div>

                {/* Pricing & Value Options Box */}
                <div className="bg-[#100d24] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        Option A: Arcade Claim
                      </span>
                      <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                        FREE REDEMPTION
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-500/20">
                        Lvl {selectedRewardForModal.min_level}
                      </span>
                      <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                        {selectedRewardForModal.min_points} μPts
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        Option B: Sponsor Purchase
                      </span>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">
                        Direct Sponsor Buy
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-white">
                        ₹{selectedRewardForModal.min_points * 2 + 499}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Information Tabs */}
                <div className="flex flex-col gap-3">
                  <div className="flex border-b border-white/5">
                    {["description", "rules", "shipping"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setModalActiveTab(tab)}
                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                          modalActiveTab === tab
                            ? "border-violet-500 text-white"
                            : "border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-[90px] text-xs leading-relaxed text-slate-300 py-1 pr-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {modalActiveTab === "description" && (
                      <p className="font-semibold text-slate-200">
                        {selectedRewardForModal.description ||
                          "No description available for this merchandise reward."}
                      </p>
                    )}
                    {modalActiveTab === "rules" && (
                      <div className="flex flex-col gap-2 font-semibold">
                        <p>
                          • Only 1 claim of this item is permitted per
                          registered player standing.
                        </p>
                        <p>
                          • Level requirement is determined by total accumulated
                          XP across all task domains.
                        </p>
                        <p>
                          • Claiming this item will immediately deduct{" "}
                          <span className="text-amber-400">
                            {selectedRewardForModal.min_points} μPoints
                          </span>{" "}
                          from your balance.
                        </p>
                        <p>
                          • Duplicate claims are automatically blocked by the
                          database integrity layer.
                        </p>
                      </div>
                    )}
                    {modalActiveTab === "shipping" && (
                      <div className="flex flex-col gap-2 font-semibold">
                        <p>
                          • processed and verified by the MuLearn team within 48
                          business hours.
                        </p>
                        <p>
                          • Digital cosmetics or license keys will be
                          distributed instantly to your profile inbox/registered
                          email.
                        </p>
                        <p>
                          • Physical merchandise will be shipped directly by
                          official sponsor{" "}
                          <span className="text-white font-bold">
                            {selectedRewardForModal.sponsor_name || "Zycoz"}
                          </span>{" "}
                          to your registered address.
                        </p>
                        <p>
                          • Estimated delivery time: 7-10 business days after
                          verification.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sponsor Info Footer line */}
                <div className="text-[10px] font-medium text-slate-400 border-t border-white/5 pt-3">
                  Sponsor:{" "}
                  <span className="font-bold text-white">
                    {selectedRewardForModal.sponsor_name || "Zycoz"}
                  </span>
                  . Visit sponsor page at{" "}
                  <a
                    href={
                      selectedRewardForModal.sponsor_url ||
                      "https://www.zycoz.com/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline font-extrabold"
                  >
                    {selectedRewardForModal.sponsor_name || "Zycoz"}
                  </a>
                  .
                </div>
              </div>

              {/* Cart Actions checkout layout */}
              <div className="mt-8 pt-6 border-t border-white/5 w-full">
                {selectedRewardForModal.claimed ? (
                  <button
                    disabled
                    className="w-full h-[48px] bg-emerald-950/40 border border-emerald-500/35 text-emerald-400 font-black text-xs tracking-widest uppercase rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
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
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    REDEEMED
                  </button>
                ) : selectedRewardForModal.quantity <= 0 ? (
                  <button
                    disabled
                    className="w-full h-[48px] bg-rose-950/40 border border-rose-500/20 text-rose-400 font-black text-xs tracking-widest uppercase rounded-xl cursor-not-allowed flex items-center justify-center"
                  >
                    OUT OF STOCK
                  </button>
                ) : level >= selectedRewardForModal.min_level &&
                  muPoints >= selectedRewardForModal.min_points ? (
                  <button
                    onClick={() => {
                      handleClaim(
                        selectedRewardForModal.id,
                        selectedRewardForModal.title,
                      );
                      closeModal();
                    }}
                    disabled={claimingId === selectedRewardForModal.id}
                    className="w-full h-[48px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(109,40,217,0.3)] hover:shadow-[0_0_24px_rgba(109,40,217,0.6)] cursor-pointer flex items-center justify-center gap-2"
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
                        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 10.5h11.25m-11.25 0l3.75-3.75M4.5 10.5l3.75 3.75"
                      />
                    </svg>
                    {claimingId === selectedRewardForModal.id
                      ? "CLAIMING..."
                      : "CLAIM FOR FREE"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1 w-full">
                    <a
                      href={
                        selectedRewardForModal.buy_url ||
                        selectedRewardForModal.sponsor_url ||
                        "https://www.zycoz.com/"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-[48px] bg-white hover:bg-slate-100 text-black border border-transparent font-black text-xs tracking-widest uppercase rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
                          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 10-3 3 3 3 0 003-3m10.5 0a3 3 0 10-3 3 3 3 0 003-3m-13.5-9h14.532c.756 0 1.301.746 1.134 1.486l-1.745 7.727a1.125 1.125 0 01-1.112.876H5.25"
                        />
                      </svg>
                      BUY ON {selectedRewardForModal.sponsor_name || "ZYCOZ"}
                    </a>
                    <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider text-center block mt-1 select-none">
                      {!player
                        ? "Sign in to claim for free"
                        : "Requirements not met"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
