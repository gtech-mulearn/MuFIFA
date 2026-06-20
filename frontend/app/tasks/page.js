"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerContext";

// Redesigned components
import Header from "./components/Header/Header";
import Stats from "./components/Stats/Stats";
import Timeline from "./components/Timeline/Timeline";
import ChallengeCard from "./components/ChallengeCard/ChallengeCard";
import ChallengeModal from "./components/ChallengeModal";
import Rewards from "./components/Rewards/Rewards";
import ComingSoonCard from "./components/ComingSoonCard";
import VideoOverlay from "./components/VideoOverlay";

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
  const [showVideo, setShowVideo] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const unlockInProgressRef = useRef(false);
  const carouselRef = useRef(null);
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

  async function fetchDbTasks() {
    try {
      const res = await fetch("/api/v1/tasks");
      const data = await res.json();
      if (res.ok && data.success) {
        setDbTasksList(data.data || []);
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
      // Load page-specific data
      Promise.all([fetchReferrals(), fetchDbTasks()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [contextPlayer, authLoading]);

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

  let githubUser = "";
  if (player && player.socials) {
    if (typeof player.socials === "object") {
      githubUser = player.socials.github || "";
    } else if (typeof player.socials === "string") {
      try {
        const parsed = JSON.parse(player.socials);
        githubUser = parsed.github || "";
      } catch (e) {}
    }
  }
  const isTask3Completed = isDbTaskCompleted(3);
  const isLevel1Completed =
    isTask1Completed && isTask2Completed && isTask3Completed;

  let discordUser = "";
  if (player && player.socials) {
    if (typeof player.socials === "object") {
      discordUser = player.socials.discord || "";
    } else if (typeof player.socials === "string") {
      try {
        const parsed = JSON.parse(player.socials);
        discordUser = parsed.discord || "";
      } catch (e) {}
    }
  }

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
        (player?.institution || player?.college || "").trim().length > 0 &&
        player?.avatar_url &&
        player.avatar_url.trim().length > 0 &&
        player?.muid &&
        player.muid.trim().length > 0
      );
      if (!isProfileComplete) {
        setVerifyError(
          "Profile details incomplete. Please ensure bio, college/institution, avatar image, and µID (µLearn ID) are updated on your profile.",
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
      const isEligible = !!discordUser && discordUser.trim().length > 0;
      if (!isEligible) {
        setVerifyError(
          "Discord link not found. Please add your Discord username under socials in your profile settings.",
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
        fetchDbTasks();

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

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -374, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 374, behavior: "smooth" });
    }
  };

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
        };
      })
      .sort((a, b) => a.id - b.id);
  })();

  const level1Tasks = mergedTasks.filter((t) => t.tier === 1);
  const level2Tasks = mergedTasks.filter((t) => t.tier === 2);

  // Process current active list of tasks
  const processedLevel1Tasks = level1Tasks.map((task, i) => {
    const isLocked = i > 0 && !level1Tasks[i - 1].completed;
    return {
      ...task,
      isLocked,
    };
  });

  const processedLevel2Tasks = level2Tasks.map((task, i) => {
    const isLocked = i > 0 && !level2Tasks[i - 1].completed;
    return {
      ...task,
      isLocked: !dbTasks.level2_unlocked || isLocked,
    };
  });
  const tier1CompletedCount = level1Tasks.filter((t) => t.completed).length;
  const tier1TotalCount = level1Tasks.length;

  const tier2CompletedCount = level2Tasks.filter((t) => t.completed).length;
  const tier2TotalCount = level2Tasks.length;

  const currentTier = dbTasks.level2_unlocked ? 2 : 1;
  const currentCompletedCount =
    currentTier === 1 ? tier1CompletedCount : tier2CompletedCount;
  const currentTotalCount =
    currentTier === 1 ? tier1TotalCount : tier2TotalCount;

  const allTasks = (() => {
    const list = [...processedLevel1Tasks];
    if (!dbTasks.level2_unlocked) {
      if (isLevel1Completed) {
        list.push({ isUnlockCard: true, id: "unlock-tier-2", mupoint: 0 });
      }
    } else {
      list.push(...processedLevel2Tasks);
    }
    return list;
  })();

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
            activeTier={currentTier}
            completedCount={currentCompletedCount}
            totalCount={currentTotalCount}
          />
        </div>
      </div>

      {/* TIMELINE */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8">
        <Timeline
          activeTier={currentTier}
          level2Unlocked={!!dbTasks.level2_unlocked}
        />
      </div>

      {/* CHALLENGES LIST */}
      <div className="flex flex-col gap-5 relative z-10 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 self-start">
            <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
              CHALLENGES
            </h2>
            {/* Carousel Navigation Arrows */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={scrollLeft}
                className="w-7 h-7 rounded-lg border border-white/5 bg-[#110e20]/60 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Scroll Left"
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
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                className="w-7 h-7 rounded-lg border border-white/5 bg-[#110e20]/60 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Scroll Right"
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
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Unified challenges list inside Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory no-scrollbar items-stretch max-w-[1098px] mx-auto w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allTasks.map((task) => {
            if (task.isUnlockCard) {
              return (
                <div
                  key={task.id}
                  className="snap-start shrink-0 w-full sm:w-[325px] md:w-[350px] flex"
                >
                  <div className="flex flex-col bg-gradient-to-b from-[#110e24]/80 to-[#070613]/80 border border-violet-500/35 hover:border-violet-500/50 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 h-full justify-between shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                    <div className="flex gap-4 items-start">
                      <div className="relative shrink-0 select-none">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          <svg
                            className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-left min-w-0">
                        <h3 className="text-xs font-black tracking-wide uppercase leading-tight text-white">
                          Unlock Tier 2
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5 min-h-[48px] max-h-[48px] overflow-hidden">
                          Tier 1 completed! Watch the transition video to unlock
                          Tier 2.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-5 border-t border-white/5 pt-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-amber-400 select-none">
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            READY TO UNLOCK
                          </span>
                        </div>
                      </div>
                      <div className="border border-amber-500/25 bg-amber-500/5 text-amber-400 px-3 py-1 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[68px] h-[48px] select-none">
                        <span className="text-sm font-black tracking-tight leading-none">
                          TIER 2
                        </span>
                        <span className="text-[7px] font-black uppercase tracking-widest mt-1">
                          ACCESS
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-1">
                      <button
                        onClick={startUnlockProcess}
                        className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md hover:from-violet-500 hover:to-indigo-500 text-[9px] font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Unlock Now</span>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                className="snap-start shrink-0 w-full sm:w-[325px] md:w-[350px] flex"
              >
                <ChallengeCard
                  task={task}
                  onViewDetails={(t) => {
                    setSelectedTaskForModal(t);
                    setIsModalOpen(true);
                  }}
                  dbTasks={dbTasks}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* TIER REWARDS ROW */}
      <div className="relative z-10 border-t border-white/5 pt-8 px-4 sm:px-6 md:px-8">
        <Rewards activeTier={currentTier} />
      </div>

      <VideoOverlay
        showVideo={showVideo}
        showCloseBtn={showCloseBtn}
        completeUnlock={completeUnlock}
      />

      <ChallengeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setVerifyError("");
          setVerifySuccess("");
        }}
        task={
          selectedTaskForModal
            ? allTasks.find((t) => t.id === selectedTaskForModal.id)
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
