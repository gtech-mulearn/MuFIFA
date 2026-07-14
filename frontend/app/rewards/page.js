"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/tasks/components/Header/Header";
import { usePlayer } from "@/components/PlayerContext";
import { calculateLevel } from "@/utils/constants";
import Avatar, { getFrameClass } from "@/components/Avatar";

// Helper to parse description metadata
const parseDescription = (descText) => {
  if (!descText) return { mainDesc: "", metadata: {} };
  const parts = descText.split("---");
  const mainDesc = parts[0].trim();
  const metadata = {};
  if (parts.length > 1) {
    const metaLines = parts[1].split("\n");
    for (const line of metaLines) {
      const separatorIdx = line.indexOf(":");
      if (separatorIdx !== -1) {
        const key = line.substring(0, separatorIdx).trim();
        const value = line.substring(separatorIdx + 1).trim();
        metadata[key] = value;
      }
    }
  }
  return { mainDesc, metadata };
};

// Helper to get HTML color value from color hex or label name
const getColorValue = (colorStr) => {
  if (colorStr.startsWith("#") || colorStr.startsWith("rgb") || colorStr.startsWith("hsl")) {
    return colorStr;
  }
  return colorStr.toLowerCase();
};

export default function RewardsPage() {
  const { player, loading: playerLoading, refreshPlayer } = usePlayer();

  // Get currently equipped frame title
  let equippedFrameTitle = "";
  if (player && player.tasks) {
    if (typeof player.tasks === "object") {
      equippedFrameTitle = player.tasks.equipped_frame || "";
    } else if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        equippedFrameTitle = parsed.equipped_frame || "";
      } catch (e) {}
    }
  }

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

  // Selected options inside product modal
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  const [selectedLevelFilter, setSelectedLevelFilter] = useState("all");

  const handleLevelFilterChange = (levelVal) => {
    setSelectedLevelFilter(levelVal);
    setPage(1);
  };

  // Fetch paginated rewards
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/rewards?page=${page}&limit=6&min_level=${selectedLevelFilter}`);
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
  }, [page, selectedLevelFilter]);

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

  // Reset active image index, tab, selected color, and quantity on modal item change
  useEffect(() => {
    setActiveImageIdx(0);
    setModalActiveTab("description");
    setSelectedQuantity(1);

    if (selectedRewardForModal) {
      const { metadata } = parseDescription(selectedRewardForModal.description);
      const colorsList = metadata.colors
        ? metadata.colors.split(",").map((c) => c.trim()).filter(Boolean)
        : ["#7C3AED", "#F43F5E", "#10B981", "#FFFFFF", "#3B82F6"];
      setSelectedColor(colorsList[0] || "");
    } else {
      setSelectedColor("");
    }
  }, [selectedRewardForModal?.id]);

  // Flash messages helper
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 5000);
  };

  // Claim reward handler
  const handleClaim = async (itemId, title, statusOptions) => {
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
        body: JSON.stringify({ merch_id: itemId, status: statusOptions }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(
          `Successfully claimed "${title}"! Check your profile or email for instructions.`,
        );
        if (refreshPlayer) refreshPlayer();
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

  const handleEquipFrame = async (frameTitle) => {
    if (!player) {
      setError("Please sign in to equip decorations.");
      return;
    }
    setError("");
    try {
      let currentTasks = {};
      if (player.tasks) {
        if (typeof player.tasks === "object") {
          currentTasks = { ...player.tasks };
        } else if (typeof player.tasks === "string") {
          try {
            currentTasks = JSON.parse(player.tasks);
          } catch (e) {}
        }
      }
      const updatedTasks = {
        ...currentTasks,
        equipped_frame: frameTitle,
      };

      const res = await fetch(`/api/v1/profile/${encodeURIComponent(player.user_id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: updatedTasks,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess(`Successfully equipped "${frameTitle}"!`);
        if (refreshPlayer) refreshPlayer();
      } else {
        setError(data.error || "Failed to equip frame.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while equipping the frame.");
    }
  };

  const handleUnequipFrame = async () => {
    if (!player) {
      setError("Please sign in to unequip decorations.");
      return;
    }
    setError("");
    try {
      let currentTasks = {};
      if (player.tasks) {
        if (typeof player.tasks === "object") {
          currentTasks = { ...player.tasks };
        } else if (typeof player.tasks === "string") {
          try {
            currentTasks = JSON.parse(player.tasks);
          } catch (e) {}
        }
      }
      const updatedTasks = {
        ...currentTasks,
        equipped_frame: "",
      };

      const res = await fetch(`/api/v1/profile/${encodeURIComponent(player.user_id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: updatedTasks,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerSuccess("Successfully unequipped frame!");
        if (refreshPlayer) refreshPlayer();
      } else {
        setError(data.error || "Failed to unequip frame.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while unequipping the frame.");
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-12 px-4 sm:px-6 md:px-8 text-white min-h-screen">
      {/* Dynamic animations injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 24s linear infinite;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.45; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      ` }} />

      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.20] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#080718]/85 via-[#080718]/80 to-[#050410]/95 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(124,92,246,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[15%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(244,63,94,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* Header Panel */}
      <div className="relative rounded-3xl overflow-hidden border border-[#8B5CF6]/15 p-6 md:p-8 flex flex-col gap-6 shadow-[0_10px_35px_rgba(0,0,0,0.4)] bg-[#0c0b22]/40 backdrop-blur-md z-10 mt-4">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.15] pointer-events-none"
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

          {/* Player Eligibility Summary Widget (HUD-Style Redesign) */}
          {!playerLoading && (
            <div className="w-full md:w-80 bg-[#0e0c28]/85 border border-[#8B5CF6]/20 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3.5 shrink-0 relative overflow-hidden group hover:border-[#8B5CF6]/40 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#7C3AED]/10 blur-xl pointer-events-none" />
              {player ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold tracking-widest text-[#A78BFA] uppercase">
                      Player Standing
                    </span>
                    <Link
                      href={`/profile/${player.user_id}`}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-black tracking-wide cursor-pointer transition-colors"
                    >
                      View Profile →
                    </Link>
                  </div>
                  
                  <div className="flex justify-between items-baseline mt-0.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        LEVEL
                      </span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A78BFA] leading-none mt-1 drop-shadow-[0_0_8px_rgba(167,139,250,0.25)]">
                        {level}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        BALANCES
                      </span>
                      <span className="text-2xl font-black text-amber-400 leading-none mt-1 flex items-center gap-1.5 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                        {muPoints}
                        <span className="text-[9px] font-bold text-slate-400 font-sans tracking-wide">
                          μPts
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                      <span>XP Progress</span>
                      {nextXp > 0 ? (
                        <span className="font-mono text-slate-300">
                          {xpInLevel} / {nextXp} XP
                        </span>
                      ) : (
                        <span className="text-violet-400">MAX LEVEL</span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-cyan-400 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all duration-500"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-1 text-center gap-2.5">
                  <span className="text-xs text-[#A78BFA] font-black uppercase tracking-widest">
                    Unlock Arcade Rewards
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Sign in to track your level, earn points, and claim exclusive gear for free.
                  </p>
                  <div className="flex gap-2.5 mt-1 w-full">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-black text-[10px] tracking-widest rounded-xl hover:opacity-95 transition-opacity uppercase cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-2 border border-white/10 hover:border-white/20 text-white font-black text-[10px] tracking-widest rounded-xl hover:bg-white/5 transition-colors uppercase cursor-pointer"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">
            Available Rewards
          </h2>
          <span className="text-[10px] text-slate-400 font-extrabold bg-[#0c0b22]/50 border border-[#8B5CF6]/10 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm">
            Sponsor Merch Store:{" "}
            <a
              href="https://www.zycoz.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A78BFA] hover:text-[#c084fc] underline font-black ml-0.5"
            >
              Zycoz
            </a>
          </span>
        </div>

        {/* Level Filters (Futuristic Segmented Console Redesign) */}
        <div className="flex flex-wrap justify-center gap-1.5 bg-[#0b0a1d]/85 border border-[#8B5CF6]/20 p-1 rounded-2xl w-fit mx-auto shadow-2xl backdrop-blur-md">
          {[
            { value: "all", label: "All Items" },
            { value: "3", label: "Level 3" },
            { value: "4", label: "Level 4" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleLevelFilterChange(tab.value)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-xl ${
                selectedLevelFilter === tab.value
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)] border border-[#a78bfa]/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-[#8B5CF6]/15 bg-[#0c0b22]/20 rounded-2xl text-slate-400 gap-3 backdrop-blur-md">
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
            <span className="text-xs font-semibold">
              No active rewards available in this category. Check back later!
            </span>
          </div>
        ) : (
          /* Responsive 3 columns grid on desktop with tactile 3D Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((item) => {
              const claimed = !!item.claimed;
              const outOfStock = !item.available_to_all && item.quantity <= 0;
              const levelEligible = item.available_to_all || level >= item.min_level;
              const pointsEligible = muPoints >= item.min_points;
              const eligible = levelEligible && pointsEligible;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedRewardForModal(item);
                    setIsRewardModalOpen(true);
                  }}
                  className="bg-gradient-to-b from-[#12112e]/70 to-[#09081a]/95 border border-[#8B5CF6]/15 hover:border-[#8B5CF6]/50 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between select-none group min-h-[350px] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(124,58,237,0.18)] cursor-pointer"
                >
                  {/* Subtle Grid Scanning Effect inside Card */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.03)_0%,_transparent_65%)] pointer-events-none" />

                  {/* Card Content Top */}
                  <div className="flex flex-col text-left relative z-10">
                    {/* Image Container with hologram circular overlay */}
                    <div className="relative w-full h-44 mb-4.5 flex items-center justify-center rounded-xl overflow-hidden bg-slate-950/65 border border-white/5 group-hover:border-[#8B5CF6]/20 transition-all duration-300">
                      {/* Grid overlay for gaming visuals */}
                      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(18,16,40,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,16,40,0.1)_1px,_transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                      {item.tag === "Avatar Frame" ? (
                        <div className="w-22 h-22 rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
                          <Avatar
                            avatarUrl={player?.avatar_url}
                            name={player?.name || "Player"}
                            equippedFrame={item.title}
                            sizeClass="w-22 h-22"
                          />
                        </div>
                      ) : item.image_url ? (
                        <img
                          src={item.image_url.split(",")[0].trim()}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-[#7C3AED]/35 group-hover:text-[#7C3AED]/50 transition-colors">
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
                      <span className={`absolute top-2.5 left-2.5 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded z-10 backdrop-blur-md shadow-md ${
                        item.available_to_all
                          ? "text-blue-400 bg-blue-950/80 border border-blue-800/30"
                          : "text-purple-400 bg-purple-950/80 border border-purple-800/30"
                      }`}>
                        {item.available_to_all ? "Global Reward" : `Lvl ${item.min_level} Choice`}
                      </span>

                      {outOfStock && (
                        <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/80 border border-rose-800/30 px-2.5 py-1 rounded z-10 backdrop-blur-md shadow-md">
                          Out of Stock
                        </span>
                      )}
                      {!outOfStock && claimed && (
                        <span className="absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/30 px-2.5 py-1 rounded z-10 backdrop-blur-md shadow-md">
                          Claimed
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black tracking-wider uppercase leading-tight text-white line-clamp-1 group-hover:text-[#A78BFA] transition-colors">
                      {item.title}
                    </h3>

                    {/* Show only main description on catalog card (excluding metadata split) */}
                    <p className="text-xs text-slate-400 mt-2.5 font-medium leading-relaxed line-clamp-2 h-9">
                      {parseDescription(item.description).mainDesc || "No description provided."}
                    </p>
                  </div>

                  {/* Card Bottom Area */}
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/5 relative z-10">
                    {/* Eligibility Display */}
                    <div className="flex justify-between items-center text-[10px]">
                      {player ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${eligible ? "bg-emerald-400" : "bg-amber-400"}`} />
                          <span className={`font-black uppercase tracking-wider text-[8px] ${eligible ? "text-emerald-400" : "text-amber-400"}`}>
                            {eligible ? "Eligible" : "Requirements Mismatch"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                          Claim Eligibility
                        </span>
                      )}
                      
                      <div className="flex gap-2">
                        <span
                          className={`font-black font-mono px-2 py-0.5 text-[9px] rounded-lg border uppercase ${
                            !player
                              ? "text-slate-400 bg-slate-900 border-white/5"
                              : levelEligible
                                ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/20"
                                : "text-amber-400 bg-amber-950/20 border-amber-500/20"
                          }`}
                        >
                          Lvl {item.min_level}
                        </span>
                        <span
                          className={`font-black font-mono px-2 py-0.5 text-[9px] rounded-lg border uppercase ${
                            !player
                              ? "text-slate-400 bg-slate-900 border-white/5"
                              : pointsEligible
                                ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/20"
                                : "text-amber-400 bg-amber-950/20 border-amber-500/20"
                          }`}
                        >
                          {item.min_points} μPts
                        </span>
                      </div>
                    </div>

                    {/* View Details Store Button */}
                    <div className="mt-1">
                      <div
                        className={`w-full py-2.5 text-[9px] font-black tracking-widest uppercase rounded-xl border transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          claimed
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20"
                            : outOfStock
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:bg-rose-500/20"
                              : "bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] border-transparent text-white shadow-md shadow-violet-600/20 group-hover:shadow-violet-600/40 group-hover:from-[#8B5CF6] group-hover:to-[#6D28D9]"
                        }`}
                      >
                        <span>
                          {claimed
                            ? item.tag === "Avatar Frame"
                              ? equippedFrameTitle.toLowerCase() === item.title.toLowerCase()
                                ? "Equipped (Inspect)"
                                : "Claimed (Inspect)"
                              : "Redeemed (Inspect)"
                            : outOfStock
                              ? "Out of Stock"
                              : "Inspect Item"}
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
          <div className="flex justify-center items-center gap-4 mt-8 relative z-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 select-none"
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
              className="px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 select-none"
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

      {/* Reward Detail Modal - AirPods Max Redesign */}
      {selectedRewardForModal && (() => {
        const parsed = parseDescription(selectedRewardForModal.description);
        const mainDesc = parsed.mainDesc;
        const meta = parsed.metadata;

        // Colors list parsing
        const colorsList = meta.colors
          ? meta.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : ["#7C3AED", "#F43F5E", "#10B981", "#FFFFFF", "#3B82F6"];

        const ratingVal = parseFloat(meta.rating || "4.8");
        const reviewsCount = parseInt(meta.reviews || "121", 10);
        const taglineText = meta.tagline || "Premium arcade choice merchandise";

        const starsStr = "★".repeat(Math.round(ratingVal)) + "☆".repeat(5 - Math.round(ratingVal));

        const categoryPath = `Rewards / ${selectedRewardForModal.tag || "Merchandise"} / ${selectedRewardForModal.title}`;

        const maxQuantity = selectedRewardForModal.available_to_all
          ? 99
          : selectedRewardForModal.quantity || 1;

        return (
          <div
            className={`challenge-modal-fixed-wrapper transition-all duration-500 ease-in-out fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md bg-black/85 overflow-y-auto ${
              isRewardModalOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Backdrop Close Click */}
            <div
              onClick={closeModal}
              className="absolute inset-0 z-0"
            />

            {/* Sliding Content Container (Tactile Terminal Box) */}
            <div
              className={`relative w-full max-w-5xl h-auto md:h-[620px] bg-gradient-to-b from-[#100f28] to-[#070617] border border-[#8B5CF6]/35 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row select-none transition-transform duration-500 ease-out z-10 ${
                isRewardModalOpen
                  ? "scale-100 translate-y-0"
                  : "scale-95 translate-y-12"
              }`}
            >
              {/* Floating Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/10 hover:border-white/20 bg-slate-950/80 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 transition-all cursor-pointer z-30 shadow-lg"
                title="Close Inspect Window"
              >
                <svg
                  className="w-4.5 h-4.5"
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

              {/* Left Panel: Hologram Viewport */}
              <div className="w-full md:w-1/2 h-80 md:h-full bg-[#0a091b] p-6 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0">
                {/* Radar Reticle Design Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] z-0">
                  <svg className="w-80 h-80 text-violet-500 animate-spin-slow" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 8" fill="none" />
                    <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.25" strokeDasharray="1 3" fill="none" />
                    <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.1" />
                    <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.1" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center gap-4.5 w-full max-w-sm">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A78BFA]">
                    Inspect Viewport
                  </span>

                  {/* Merchandise Image Carousel with Floating effect */}
                  <div className="relative w-full h-56 md:h-68 shrink-0 flex items-center justify-center overflow-hidden group/modalimg animate-float">
                    {selectedRewardForModal.tag === "Avatar Frame" ? (
                      <div className="w-36 h-36 rounded-full flex items-center justify-center relative">
                        <Avatar
                          avatarUrl={player?.avatar_url}
                          name={player?.name || "Player"}
                          equippedFrame={selectedRewardForModal.title}
                          sizeClass="w-36 h-36"
                        />
                      </div>
                    ) : (() => {
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
                              className="w-16 h-16"
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

                      const currentImage = imageUrls[activeImageIdx] || imageUrls[0];

                      return (
                        <>
                          <img
                            src={currentImage}
                            alt={selectedRewardForModal.title}
                            className="max-h-[95%] max-w-[95%] object-contain relative z-10 drop-shadow-[0_8px_30px_rgba(139,92,246,0.45)] transition-all duration-300"
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
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 flex items-center justify-center text-white hover:scale-110 transition-all z-20 cursor-pointer shadow-md opacity-0 group-hover/modalimg:opacity-100"
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
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/80 border border-white/10 hover:border-white/20 flex items-center justify-center text-white hover:scale-110 transition-all z-20 cursor-pointer shadow-md opacity-0 group-hover/modalimg:opacity-100"
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

                              {/* LED Indicators */}
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
                                        ? "bg-[#A78BFA] w-3 shadow-[0_0_8px_#8b5cf6]"
                                        : "bg-white/30"
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
                      <div className="flex gap-2 overflow-x-auto justify-center py-1 w-full max-w-sm scrollbar-none">
                        {imageUrls.map((url, idx) => (
                          <button
                            key={url + idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIdx(idx);
                            }}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 bg-slate-950 flex-shrink-0 transition-all cursor-pointer ${
                              idx === activeImageIdx
                                ? "border-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.5)] scale-105"
                                : "border-white/10 opacity-55 hover:opacity-100"
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

                  {/* Requirements Indicators */}
                  <div className="flex flex-row gap-3 mt-1.5 justify-center items-center w-full">
                    <div className="bg-[#100d2b]/80 border border-[#8B5CF6]/15 rounded-xl p-3 flex flex-col items-center justify-center shadow-lg flex-1">
                      <span className="text-xl font-black text-[#A78BFA] font-mono leading-none">
                        LVL {selectedRewardForModal.min_level}
                      </span>
                      <span className="text-[8px] font-extrabold tracking-widest text-slate-500 mt-1 uppercase">
                        Min Level
                      </span>
                    </div>

                    <div className="bg-[#100d2b]/80 border border-[#8B5CF6]/15 rounded-xl p-3 flex flex-col items-center justify-center shadow-lg flex-1">
                      <span className="text-xl font-black text-amber-400 font-mono leading-none drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                        {selectedRewardForModal.min_points}
                      </span>
                      <span className="text-[8px] font-extrabold tracking-widest text-slate-500 mt-1 uppercase">
                        μPoints Cost
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Content details (AirPods Max Redesign UI) */}
              <div className="w-full md:w-1/2 h-auto md:h-full p-6 md:p-8 flex flex-col justify-between bg-[#0e0c24]/90 md:overflow-y-auto">
                <div className="flex flex-col gap-4 text-left mt-2 md:mt-4">
                  {/* Category Path Breadcrumb */}
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {categoryPath}
                  </span>

                  {/* Title & Tagline */}
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight">
                      {selectedRewardForModal.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {taglineText}
                    </p>
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-amber-400 font-mono tracking-wider">
                      {starsStr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      ({reviewsCount})
                    </span>
                  </div>

                  <hr className="border-white/5 my-1" />

                  {/* Points and pricing display */}
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Redemption Cost
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                        {selectedRewardForModal.min_points} μPts
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        or direct ₹{selectedRewardForModal.min_points * 2 + 499}
                      </span>
                    </div>
                  </div>

                  {/* Color Selector */}
                  {selectedRewardForModal.tag !== "Avatar Frame" && (
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[9px] font-extrabold text-[#A78BFA] uppercase tracking-widest">
                        Choose a Color
                      </span>
                      <div className="flex gap-2.5 items-center">
                        {colorsList.map((color) => {
                          const isSelected = selectedColor === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              className={`w-6.5 h-6.5 rounded-full border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: getColorValue(color) }}
                              title={`Select option: ${color}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity selector & stock state */}
                  <div className="flex items-center gap-6 mt-2">
                    {selectedRewardForModal.tag !== "Avatar Frame" && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                          Quantity
                        </span>
                        {selectedRewardForModal.claimed ? (
                          <span className="text-xs font-bold text-slate-500 font-mono">1 (Max Limit)</span>
                        ) : (
                          <div className="flex items-center gap-3 bg-[#120f2b] border border-[#8B5CF6]/20 px-2.5 py-1 rounded-xl w-fit">
                            <button
                              type="button"
                              onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                              disabled={selectedQuantity === 1}
                              className="text-slate-400 hover:text-white font-extrabold text-sm px-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="text-xs font-mono font-black text-white w-4 text-center select-none">
                              {selectedQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedQuantity((q) => Math.min(maxQuantity, q + 1))}
                              disabled={selectedQuantity === maxQuantity}
                              className="text-slate-400 hover:text-white font-extrabold text-sm px-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                        Stock Availability
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            selectedRewardForModal.available_to_all || selectedRewardForModal.quantity > 5
                              ? "bg-emerald-400"
                              : selectedRewardForModal.quantity > 0
                                ? "bg-amber-400"
                                : "bg-rose-500"
                          }`}
                        />
                        <span className="text-[10px] font-bold text-slate-300">
                          {selectedRewardForModal.available_to_all ? (
                            <span>Unlimited Stock</span>
                          ) : selectedRewardForModal.quantity > 5 ? (
                            <span>In Stock ({selectedRewardForModal.quantity} left)</span>
                          ) : selectedRewardForModal.quantity > 0 ? (
                            <span className="text-amber-400 font-extrabold">Only {selectedRewardForModal.quantity} left!</span>
                          ) : (
                            <span className="text-rose-400 font-extrabold">Out of Stock</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Information Tabs */}
                  <div className="flex flex-col gap-2.5 mt-2">
                    <div className="flex border-b border-white/5">
                      {["description", "rules", "shipping"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setModalActiveTab(tab)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                            modalActiveTab === tab
                              ? "border-rose-500 text-white"
                              : "border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-[75px] text-xs leading-relaxed text-slate-400 py-0.5 pr-1 max-h-[110px] overflow-y-auto scrollbar-thin">
                      {modalActiveTab === "description" && (
                        <p className="font-semibold text-slate-300">
                          {mainDesc || "No description available for this merchandise reward."}
                        </p>
                      )}
                      {modalActiveTab === "rules" && (
                        <div className="flex flex-col gap-1 font-semibold text-[11px]">
                          <p>• Max 1 claim per registered player standing.</p>
                          <p>• Level requirement is determined by total accumulated XP.</p>
                          {!selectedRewardForModal.available_to_all && (
                            <p className="text-[#A78BFA]">• This is a Level {selectedRewardForModal.min_level} choice reward.</p>
                          )}
                        </div>
                      )}
                      {modalActiveTab === "shipping" && (
                        <div className="flex flex-col gap-1 font-semibold text-[11px]">
                          <p>• Digital cosmetics are distributed instantly.</p>
                          <p>• Physical merchandise will be shipped directly by official sponsor <span className="text-white font-bold">{selectedRewardForModal.sponsor_name || "Zycoz"}</span>.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Free Delivery and Return Policy Blocks (Screenshot Redesign) */}
                  {selectedRewardForModal.tag !== "Avatar Frame" && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-1.5 border-t border-white/5 pt-3.5">
                      {/* Free Delivery */}
                      <div className="flex items-start gap-2.5 bg-[#120f2b]/60 border border-[#8B5CF6]/15 rounded-xl p-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 mt-0.5">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.208-3.32a2.25 2.25 0 0 0-2.201-2.106H16.5m-3-3V12m0 0l-3-3m3 3l3-3M2.25 12h8.25" />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Free Delivery</span>
                          <span className="text-[8px] font-bold text-slate-400">{meta.delivery || "Dispatched within 24 hours. Free shipping above ₹1000."}</span>
                        </div>
                      </div>

                      {/* Return Policy */}
                      <div className="flex items-start gap-2.5 bg-[#120f2b]/60 border border-[#8B5CF6]/15 rounded-xl p-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-200">Returns Policy</span>
                          <span className="text-[8px] font-bold text-slate-400">{meta.returns || "Free 30-day delivery returns."}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Actions checkout layout (Vibrant Rose-Pink Gradient CTA) */}
                <div className="mt-4.5 pt-4 border-t border-white/5 w-full">
                  {selectedRewardForModal.claimed ? (
                    selectedRewardForModal.tag === "Avatar Frame" ? (
                      equippedFrameTitle.toLowerCase() === selectedRewardForModal.title.toLowerCase() ? (
                        <button
                          onClick={() => {
                            handleUnequipFrame();
                            closeModal();
                          }}
                          className="w-full h-[48px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 font-black text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          UNEQUIP DECORATION
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleEquipFrame(selectedRewardForModal.title);
                            closeModal();
                          }}
                          className="w-full h-[48px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-black text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          EQUIP DECORATION
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="w-full h-[48px] bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-black text-xs tracking-widest uppercase rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
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
                    )
                  ) : (!selectedRewardForModal.available_to_all && selectedRewardForModal.quantity <= 0) ? (
                    <button
                      disabled
                      className="w-full h-[48px] bg-rose-950/20 border border-rose-500/10 text-rose-400 font-black text-xs tracking-widest uppercase rounded-xl cursor-not-allowed flex items-center justify-center"
                    >
                      OUT OF STOCK
                    </button>
                  ) : (selectedRewardForModal.available_to_all || level >= selectedRewardForModal.min_level) &&
                    muPoints >= selectedRewardForModal.min_points ? (
                    <button
                      onClick={() => {
                        handleClaim(
                          selectedRewardForModal.id,
                          selectedRewardForModal.title,
                          `Color: ${selectedColor || "Default"}, Qty: ${selectedQuantity}`,
                        );
                        closeModal();
                      }}
                      disabled={claimingId === selectedRewardForModal.id}
                      className="w-full h-[48px] bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:shadow-[0_0_24px_rgba(244,63,94,0.6)] cursor-pointer flex items-center justify-center gap-2"
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
                    <div className="flex flex-col gap-1.5 w-full">
                      <a
                        href={
                          selectedRewardForModal.buy_url ||
                          selectedRewardForModal.sponsor_url ||
                          "https://www.zycoz.com/"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-[48px] bg-white hover:bg-slate-100 text-black border border-transparent font-black text-xs tracking-widest uppercase rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
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
                      <span className="text-[8px] text-rose-400 font-extrabold uppercase tracking-widest text-center block mt-1.5 select-none">
                        {!player
                          ? "Sign in to unlock free arcade claim"
                          : "Requirements not met for free arcade claim"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
