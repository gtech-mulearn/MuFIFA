"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerContext";

// Redesigned components
import Header from "./components/Header/Header";
import Stats from "./components/Stats/Stats";
import ChallengeCard from "./components/ChallengeCard/ChallengeCard";
import ChallengeModal from "./components/ChallengeModal";
import Rewards from "./components/Rewards/Rewards";
import ComingSoonCard from "./components/ComingSoonCard";

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
  const [dbTasksList, setDbTasksList] = useState([]);

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
    try {
      const res = await fetch(`/api/v1/tasks?limit=6&page=${page}&category=${category}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDbTasksList(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          setTotalPages(1);
        }
        if (data.overallStats) {
          setOverallTotal(data.overallStats.totalTasks || 0);
          setOverallCompleted(data.overallStats.completedTasks || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database tasks:", err);
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
    fetchDbTasks(currentPage, selectedCategory).finally(() => {
      setLoading(false);
    });
  }, [currentPage, selectedCategory, player]);

  const handleCategoryChange = (cat) => {
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
    if (task.id === 1) {
      const isEligible = referralCount > 0 || referrals.length > 0;
      if (!isEligible) {
        setVerifyError(
          "Referral not found. Please ensure at least 1 friend has registered using your unique link.",
        );
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 2) {
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

    } else if (task.id === 5) {
      const isEligible = (player?.mu_points || 0) >= 20;
      if (!isEligible) {
        setVerifyError(
          "Insufficient points. Please accumulate a total of at least 20 μPoints.",
        );
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 6) {
      // Bypassed since socials is not in DB
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

        const longDesc = dbTask.guidelines ? (
          <div dangerouslySetInnerHTML={{ __html: dbTask.guidelines }} />
        ) : (
          <p className="text-[10px] text-slate-300">{dbTask.description}</p>
        );

        // Handle profile URL mapping dynamically for user ID redirect
        const actionUrl =
          dbTask.action_url && dbTask.action_url.startsWith("/profile")
            ? `/profile/${player?.user_id}`
            : dbTask.action_url || "#";

        return {
          id: dbTask.id,
          title: dbTask.title || `Challenge ${dbTask.id}`,
          shortDesc: dbTask.short_desc || dbTask.description || "",
          longDesc,
          reward: `Earn +${dbTask.mupoint || 0} μPoints & custom XP breakdown.`,
          completed,
          actionLabel: dbTask.action_label || "View Details",
          actionUrl,
          tier: dbTask.tier || 1,
          mupoint: dbTask.mupoint || 0,
          category: dbTask.category || "",
        };
      })
      .sort((a, b) => a.id - b.id);
  })();

  // Helper to categorize tasks dynamically based on content attributes
  const getTaskCategory = (task) => {
    const title = (task.title || "").toLowerCase();
    const desc = (task.shortDesc || task.description || "").toLowerCase();
    
    if (title.includes("uiux") || title.includes("ui/ux") || title.includes("ui") || title.includes("ux") || title.includes("design") || desc.includes("design") || desc.includes("ui/ux") || desc.includes("uiux")) return "UIUX";
    if (title.includes("cyber") || title.includes("security") || title.includes("kuzhi") || title.includes("pothole")) return "Cyber";
    if (title.includes("web") || title.includes("website") || title.includes("frontend") || title.includes("backend") || title.includes("nextjs") || title.includes("api") || desc.includes("web")) return "Web";
    if (title.includes("social") || title.includes("discord") || title.includes("referral") || title.includes("invite") || title.includes("git") || title.includes("profile")) return "Social";
    if (title.includes("iot") || title.includes("hardware") || title.includes("sensor")) return "IoT";
    if (title.includes("dsa") || title.includes("leetcode") || title.includes("algorithm") || title.includes("data structure") || title.includes("codeforces") || title.includes("coding")) return "DSA";
    
    return "Other";
  };

  const filteredTasks = mergedTasks;

  const completedCount = overallCompleted;
  const totalCount = overallTotal;

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
          <Header />
        </div>

        {/* STATS ROW (Progression Shield & Achievements) */}
        <div className="relative z-10">
          <Stats
            completedCount={completedCount}
            totalCount={totalCount}
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
            <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap bg-white/5 border border-white/5 p-1 rounded-xl">
              {["All", "UIUX", "Cyber", "Web", "Other", "Social", "IoT", "DSA"].map((cat) => (
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
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 select-none">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl border text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                currentPage === 1
                  ? "border-white/5 bg-white/2 opacity-30 cursor-not-allowed text-slate-500"
                  : "border-violet-500/25 bg-[#110e20]/60 text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    currentPage === p
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-slate-200 bg-white/5 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl border text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                currentPage === totalPages
                  ? "border-white/5 bg-white/2 opacity-30 cursor-not-allowed text-slate-500"
                  : "border-violet-500/25 bg-[#110e20]/60 text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10"
              }`}
            >
              <span>Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* REWARDS ROW */}
      <div className="relative z-10 border-t border-white/5 pt-8 px-4 sm:px-6 md:px-8">
        <Rewards />
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
