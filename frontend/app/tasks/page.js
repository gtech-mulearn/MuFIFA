"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import { usePlayer } from "@/components/PlayerContext";
import { marked } from "marked";

// Configure marked to handle clean breaks
marked.setOptions({
  breaks: true,
  gfm: true
});

// Redesigned components
import Header from "./components/Header/Header";
import Stats from "./components/Stats/Stats";
import ChallengeCard from "./components/ChallengeCard/ChallengeCard";
import ChallengeModal from "./components/ChallengeModal";
import Rewards from "./components/Rewards/Rewards";
import ComingSoonCard from "./components/ComingSoonCard";

function parseMarkdown(text) {
  if (!text) return "";
  try {
    return marked.parse(text);
  } catch (e) {
    console.error("Markdown parsing failed:", e);
    return text;
  }
}

export default function TasksPage() {
  const { player: contextPlayer, loading: authLoading } = usePlayer();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallCompleted, setOverallCompleted] = useState(0);
  const [overallCompletedPoints, setOverallCompletedPoints] = useState(0);
  const [dbTasksList, setDbTasksList] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch referrals to double check task 1 status
  async function fetchReferrals() {
    try {
      const res = await fetch("/api/v1/profile/referrals");
      const data = await res.json();
      if (res.ok && data.success) {
        setReferrals(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    }
  }

  async function fetchDbTasks(page = currentPage, category = selectedCategory) {
    if (page > 1) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/v1/tasks?limit=9&page=${page}&category=${category}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDbTasksList(prev => page === 1 ? (data.data || []) : [...prev, ...(data.data || [])]);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          setTotalPages(1);
        }
        if (data.overallStats) {
          setOverallTotal(data.overallStats.totalTasks || 0);
          setOverallCompleted(data.overallStats.completedTasks || 0);
          setOverallCompletedPoints(data.overallStats.completedPoints || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database tasks:", err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }

  // Use player from context instead of fetching /api/v1/auth/me
  useEffect(() => {
    if (authLoading) return;
    if (contextPlayer) {
      setPlayer(contextPlayer);
      fetchReferrals();
    } else {
      setLoading(false);
    }
  }, [contextPlayer, authLoading]);

  // Fetch paginated tasks whenever page or category changes
  useEffect(() => {
    if (!player) return;
    fetchDbTasks(currentPage, selectedCategory);
  }, [currentPage, selectedCategory, player]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (loading || isLoadingMore || currentPage >= totalPages) return;

      const threshold = 150; // pixels from the bottom
      const totalHeight = document.documentElement.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

      if (totalHeight - (windowHeight + scrollPosition) < threshold) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, isLoadingMore, currentPage, totalPages]);

  const handleCategoryChange = (cat) => {
    setDbTasksList([]); // Clear the list immediately so we don't show stale tasks
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Helper to extract JSON tasks object
  const dbTasks = (() => {
    if (!player || !player.tasks) return {};
    if (typeof player.tasks === "object") return player.tasks;
    try {
      return JSON.parse(player.tasks);
    } catch {
      return {};
    }
  })();

  // --- Tier 1 Completion Conditions ---
  let referralCount = 0;
  if (player && player.tasks) {
    if (typeof player.tasks === "object") {
      referralCount = player.tasks.referal || 0;
    } else if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        referralCount = parsed.referal || 0;
      } catch (e) {}
    }
  }
  const isDbTaskCompleted = (taskId) => {
    return !!dbTasksList.find((t) => t.id === taskId)?.completed;
  };

  const isTask1Completed = isDbTaskCompleted(1);
  const hasPredictions = (player?.predictions_count || 0) > 0;
  const isTask2Completed = isDbTaskCompleted(2);

  const isTask3Completed = isDbTaskCompleted(3);
  const isLevel1Completed =
    isTask1Completed && isTask2Completed && isTask3Completed;

  // Selected task detail view modal handler

  const handleVerifyTask = async (task) => {
    setVerifyError("");
    setVerifySuccess("");
    setVerifyingTaskId(task.id);

    // 1. Check if the task criteria is met locally
    const vMethod = task.verification || "";
    const isReferral = vMethod === "referral" || task.id === 1;
    const isProfile = vMethod === "profile" || task.id === 2;
    const isPoints = vMethod === "points" || task.id === 5;

    if (isReferral) {
      const isEligible = referralCount > 0 || referrals.length > 0;
      if (!isEligible) {
        setVerifyError(
          "Referral not found. Please ensure at least 1 friend has registered using your unique link.",
        );
        setVerifyingTaskId(null);
        return;
      }
    } else if (isProfile) {
      const isProfileComplete = !!(
        player?.bio &&
        player.bio.trim().length > 0 &&
        player?.avatar_url &&
        player.avatar_url.trim().length > 0 &&
        player?.muid &&
        player.muid.trim().length > 0
      );
      if (!isProfileComplete) {
        setVerifyError(
          "Profile details incomplete. Please ensure bio, avatar image, and µID (µLearn ID) are updated on your profile.",
        );
        setVerifyingTaskId(null);
        return;
      } else if (!hasPredictions) {
        setVerifyError(
          "Prediction not found. Please ensure you have made at least 1 prediction on any match.",
        );
        setVerifyingTaskId(null);
        return;
      }
    } else if (isPoints) {
      const isEligible = (player?.mu_points || 0) >= 20;
      if (!isEligible) {
        setVerifyError(
          "Insufficient points. Please accumulate a total of at least 20 μPoints.",
        );
        setVerifyingTaskId(null);
        return;
      }
    }

    try {
      // Call the verify task API endpoint to complete tasks in user_completed_tasks
      const res = await fetch(`/api/v1/tasks/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          task_id: task.id
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer((prev) => {
          const currentTasks = (() => {
            if (!prev.tasks) return {};
            if (typeof prev.tasks === "object") return prev.tasks;
            try {
              return JSON.parse(prev.tasks);
            } catch {
              return {};
            }
          })();
          return {
            ...prev,
            mu_points: (prev.mu_points || 0) + (task.mupoint || 0),
            tasks: {
              ...currentTasks,
              [`task${task.id}`]: true,
            },
          };
        });

        // Refetch database tasks list to sync the UI completion state immediately
        fetchDbTasks(currentPage, selectedCategory);

        setVerifySuccess(
          data.message || `Task ${task.id} verified and updated!`,
        );
        setTimeout(() => setVerifySuccess(""), 4000);
      } else {
        setVerifyError(data.error || "Failed to verify task.");
      }
    } catch (err) {
      console.error("Task verification failed:", err);
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const startUnlockProcess = () => {
    setShowVideo(true);
    setShowCloseBtn(false);
    // Show close button after 2 seconds to allow early skipping
    setTimeout(() => {
      setShowCloseBtn(true);
    }, 2000);
    // Automatically close video and complete unlock after 8 seconds
    setTimeout(() => {
      completeUnlock();
    }, 8000);
  };

  const completeUnlock = async () => {
    if (unlockInProgressRef.current) return;
    unlockInProgressRef.current = true;
    try {
      const updatedTasks = {
        ...dbTasks,
        level2_unlocked: true,
      };

      const res = await fetch(`/api/v1/profile/${player.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      if (res.ok) {
        setPlayer((prev) => ({
          ...prev,
          tasks: updatedTasks,
        }));
        setShowVideo(false);
        setShowCloseBtn(false);
      } else {
        alert("Failed to unlock Tier 2. Please try again.");
        unlockInProgressRef.current = false;
      }
    } catch (err) {
      console.error("Failed to unlock Tier 2:", err);
      alert("Network error. Please try again.");
      unlockInProgressRef.current = false;
    }
  };

  // Carousel scroll functions removed (replaced by pagination grid)

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#05030a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Map database tasks list to the expected format
  const mergedTasks = (() => {
    return dbTasksList
      .map((dbTask) => {
        const completed = !!dbTask.completed;

        // Check if guidelines is a levels progression JSON or task has sub-levels
        let isJsonLevels = false;
        let levelsData = null;
        if (dbTask.guidelines && dbTask.guidelines.trim().startsWith("{\"levels\":")) {
          try {
            const parsed = JSON.parse(dbTask.guidelines);
            if (parsed && Array.isArray(parsed.levels)) {
              isJsonLevels = true;
              levelsData = parsed.levels;
            }
          } catch (e) {
            console.error("Failed to parse guidelines levels JSON in mergedTasks:", e);
          }
        } else if (dbTask.sub_levels && Array.isArray(dbTask.sub_levels) && dbTask.sub_levels.length > 0) {
          isJsonLevels = true;
          levelsData = dbTask.sub_levels.map((sl, index) => ({
            level: index + 1,
            title: sl.title || `Level ${index + 1}`,
            description: sl.description || sl.short_desc || "",
          }));
        }

        const longDesc = isJsonLevels ? (
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-violet-400">Progression Challenge (Levels):</span>
            <div className="flex flex-col gap-2 pl-2 border-l border-violet-500/30">
              {levelsData.map((lvl) => {
                const safeDesc = DOMPurify.sanitize(parseMarkdown(lvl.description || ""), {
                  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'span', 'code', 'a'],
                  ALLOWED_ATTR: ['href', 'target', 'rel'],
                });
                return (
                  <div key={lvl.level} className="text-[11px] text-slate-300 leading-normal flex flex-col">
                    <span className="font-bold text-slate-100">Level {lvl.level}: {lvl.title}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1" dangerouslySetInnerHTML={{ __html: safeDesc }} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : dbTask.guidelines ? (() => {
          const safe = DOMPurify.sanitize(parseMarkdown(dbTask.guidelines), {
            ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'code', 'pre', 'blockquote', 'hr'],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
          });
          return <div dangerouslySetInnerHTML={{ __html: safe }} />;
        })() : (
          <p className="text-[10px] text-slate-300">{dbTask.description}</p>
        );

        // Handle profile URL mapping dynamically for user ID redirect
        const actionUrl =
          dbTask.action_url && dbTask.action_url.startsWith("/profile")
            ? `/profile/${player?.user_id}`
            : dbTask.action_url || "#";

        // Compute total MuPoints for this challenge (including all sub-levels)
        let totalMuPoints = dbTask.mupoint || 0;
        if (dbTask.sub_levels && Array.isArray(dbTask.sub_levels) && dbTask.sub_levels.length > 0) {
          totalMuPoints += dbTask.sub_levels.reduce((sum, sl) => sum + (sl.mupoint || 0), 0);
        }

        // Compute total XP for this challenge (including all sub-levels)
        let totalXP = (dbTask.xp_creativity || 0) + (dbTask.xp_branding || 0) + (dbTask.xp_innovation || 0) + (dbTask.xp_teamwork || 0) + (dbTask.xp_execution || 0);
        if (dbTask.sub_levels && Array.isArray(dbTask.sub_levels) && dbTask.sub_levels.length > 0) {
          totalXP += dbTask.sub_levels.reduce((sum, sl) => {
            return sum + (sl.xp_creativity || 0) + (sl.xp_branding || 0) + (sl.xp_innovation || 0) + (sl.xp_teamwork || 0) + (sl.xp_execution || 0);
          }, 0);
        }

        return {
          id: dbTask.id,
          title: dbTask.title || `Challenge ${dbTask.id}`,
          shortDesc: dbTask.short_desc || dbTask.description || "",
          longDesc,
          reward: `Earn +${totalMuPoints} μPoints & custom XP breakdown.`,
          completed,
          actionLabel: dbTask.action_label || "View Details",
          actionUrl,
          mupoint: totalMuPoints,
          category: dbTask.category || "",
          xpValue: totalXP,
          isLocked: dbTask.isLocked || false,
          logo_url: dbTask.logo_url || null,
          verification: dbTask.verification || null,
          guidelines: dbTask.guidelines || null,
          sub_levels: dbTask.sub_levels || [],
          visibility: dbTask.visibility || "preview",
          xp_creativity: dbTask.xp_creativity || 0,
          xp_branding: dbTask.xp_branding || 0,
          xp_innovation: dbTask.xp_innovation || 0,
          xp_teamwork: dbTask.xp_teamwork || 0,
          xp_execution: dbTask.xp_execution || 0,
        };
      })
      .sort((a, b) => a.id - b.id);
  })();

  // Helper to categorize tasks dynamically based on content attributes
  const getTaskCategory = (task) => {
    const title = (task.title || "").toLowerCase();
    const desc = (task.shortDesc || task.description || "").toLowerCase();
    
    if (title.includes("social") || title.includes("discord") || title.includes("referral") || title.includes("invite") || title.includes("git") || title.includes("profile")) return "Social";
    if (title.includes("dsa") || title.includes("leetcode") || title.includes("algorithm") || title.includes("data structure") || title.includes("codeforces") || title.includes("coding") || title.includes("web") || title.includes("website") || title.includes("frontend") || title.includes("backend") || title.includes("nextjs") || title.includes("api") || desc.includes("web")) return "Coder";
    if (title.includes("uiux") || title.includes("ui/ux") || title.includes("ui") || title.includes("ux") || title.includes("design") || desc.includes("design") || desc.includes("ui/ux") || desc.includes("uiux")) return "Creative";
    if (title.includes("iot") || title.includes("hardware") || title.includes("sensor") || title.includes("maker") || desc.includes("hardware")) return "Maker";
    
    return "Strategist";
  };

  const filteredTasks = mergedTasks;

  const completedCount = overallCompleted;
  const totalCount = overallTotal;

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      <style dangerouslySetInnerHTML={{ __html: `
        .guidelines-html-container h1 {
          font-size: 1.5rem !important;
          font-weight: 900 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          color: #ffffff !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          padding-bottom: 0.25rem !important;
          display: block !important;
        }
        .guidelines-html-container h2 {
          font-size: 1.3rem !important;
          font-weight: 850 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: #ffffff !important;
          display: block !important;
        }
        .guidelines-html-container h3 {
          font-size: 1.15rem !important;
          font-weight: 800 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          color: #a78bfa !important;
          display: block !important;
        }
        .guidelines-html-container ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
        }
        .guidelines-html-container ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
        }
        .guidelines-html-container li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          line-height: 1.5 !important;
          display: list-item !important;
        }
        .guidelines-html-container hr {
          border: 0 !important;
          border-top: 1px solid rgba(255,255,255,0.12) !important;
          margin-top: 1.25rem !important;
          margin-bottom: 1.25rem !important;
          display: block !important;
        }
        .guidelines-html-container p {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.6 !important;
          display: block !important;
        }
        .guidelines-html-container code {
          background-color: rgba(139,92,246,0.15) !important;
          color: #c084fc !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-family: monospace !important;
          font-size: 0.85em !important;
          border: 1px solid rgba(139,92,246,0.2) !important;
          display: inline-block !important;
        }
        .guidelines-html-container pre {
          background-color: rgba(0,0,0,0.4) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          padding: 1rem !important;
          border-radius: 0.75rem !important;
          overflow-x: auto !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
          display: block !important;
        }
        .guidelines-html-container pre code {
          background-color: transparent !important;
          color: inherit !important;
          padding: 0 !important;
          border: none !important;
          font-size: 0.9em !important;
          display: block !important;
        }
        .guidelines-html-container a {
          color: #a78bfa !important;
          text-decoration: underline !important;
        }
        .guidelines-html-container a:hover {
          color: #c084fc !important;
        }
      ` }} />
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
          <Header />
        </div>

        {/* STATS ROW (Progression Shield & Achievements) */}
        <div className="relative z-10">
          <Stats
            completedCount={completedCount}
            totalCount={totalCount}
            completedPoints={overallCompletedPoints}
            player={player}
          />
        </div>
      </div>

      {/* CHALLENGES LIST */}
      <div className="flex flex-col gap-5 relative z-10 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start w-full justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
                CHALLENGES
              </h2>
            </div>

            {/* Category Filter Tabs Selector */}
            <div className="w-full sm:w-auto flex flex-wrap gap-2 sm:gap-3 bg-white/5 border border-white/5 p-1 rounded-xl">
              {["All", "Coder", "Social", "Creative", "Maker", "Strategist"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-lg ${
                    selectedCategory === cat
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Unified challenges list inside Grid */}
        <div className="max-w-[1098px] mx-auto w-full">
          {filteredTasks.length === 0 ? (
            <ComingSoonCard category={selectedCategory} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-stretch">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex h-full">
                  <ChallengeCard
                    task={task}
                    onViewDetails={(t) => {
                      setSelectedTaskForModal(t);
                      setIsModalOpen(true);
                    }}
                    dbTasks={dbTasks}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {/* Infinite Scroll Loading Status */}
        {(isLoadingMore || currentPage < totalPages) && (
          <div className="flex flex-col items-center justify-center gap-2 mt-8 py-4">
            {isLoadingMore ? (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Loading More Tasks...
                </span>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Load More Tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* REWARDS ROW */}
      <div className="relative z-10 border-t border-white/5 pt-8 px-4 sm:px-6 md:px-8">
        <Rewards player={player} />
      </div>

      <ChallengeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setVerifyError("");
          setVerifySuccess("");
        }}
        task={
          selectedTaskForModal
            ? mergedTasks.find((t) => t.id === selectedTaskForModal.id)
            : null
        }
        onVerify={handleVerifyTask}
        verifyingTaskId={verifyingTaskId}
        verifyError={verifyError}
        verifySuccess={verifySuccess}
      />
    </div>
  );
}
