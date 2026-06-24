"use client";

import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useAdmin } from "../../layout";

// Import player dashboard components
import Header from "../../../tasks/components/Header/Header";
import Stats from "../../../tasks/components/Stats/Stats";
import ChallengeCard from "../../../tasks/components/ChallengeCard/ChallengeCard";
import ChallengeModal from "../../../tasks/components/ChallengeModal";
import Rewards from "../../../tasks/components/Rewards/Rewards";
import ComingSoonCard from "../../../tasks/components/ComingSoonCard";

const MOCK_PLAYER = {
  user_id: "mock-admin-preview-user",
  name: "Admin Preview Mode",
  username: "admin_preview",
  mu_points: 350,
  predictions_count: 5,
  avatar_url: "/avatar-default.png",
  bio: "This is a preview mode profile for admin task inspection.",
  muid: "ADMIN007",
  tasks: {
    referal: 3,
    level2_unlocked: true,
  }
};

export default function AdminTasksPreviewPage() {
  const admin = useAdmin();
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

  // Fetch referrals to double check task status
  async function fetchReferrals() {
    try {
      const res = await fetch("/api/v1/profile/referrals");
      const data = await res.json();
      if (res.ok && data.success) {
        setReferrals(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    }
  }

  async function fetchDbTasks(page = currentPage, category = selectedCategory) {
    try {
      const res = await fetch(`/api/v1/tasks?limit=6&page=${page}&category=${category}&preview=true`);
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
          setOverallCompletedPoints(data.overallStats.completedPoints || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database tasks:", err);
    }
  }

  // Load player info (if player auth cookie exists) or fallback to MOCK_PLAYER
  useEffect(() => {
    async function loadPlayer() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setPlayer(data.data);
            fetchReferrals();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch player auth:", err);
      }
      // Fallback if not logged in as player
      setPlayer(MOCK_PLAYER);
    }
    
    if (admin) {
      loadPlayer();
    }
  }, [admin]);

  // Fetch tasks when player is set, page changes, or category changes
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

  const dbTasks = (() => {
    if (!player || !player.tasks) return {};
    if (typeof player.tasks === "object") return player.tasks;
    try {
      return JSON.parse(player.tasks);
    } catch {
      return {};
    }
  })();

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

  const handleVerifyTask = async (task) => {
    setVerifyError("");
    setVerifySuccess("");
    setVerifyingTaskId(task.id);

    // If using mock player, simulate completion client-side
    if (player.user_id === "mock-admin-preview-user") {
      setTimeout(() => {
        setVerifySuccess(`[PREVIEW MODE] Task ${task.id} verified and updated locally!`);
        setPlayer((prev) => {
          const currentTasks = prev.tasks || {};
          return {
            ...prev,
            mu_points: (prev.mu_points || 0) + (task.mupoint || 0),
            tasks: {
              ...currentTasks,
              [`task${task.id}`]: true,
            },
          };
        });

        // Sync completion state immediately in local tasks list
        setDbTasksList((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t))
        );

        setVerifyingTaskId(null);
        setTimeout(() => setVerifySuccess(""), 4000);
      }, 1000); // simulate quick delay
      return;
    }

    // Real verification for linked player accounts
    const vMethod = task.verification || "";
    const isReferral = vMethod === "referral" || task.id === 1;
    const isProfile = vMethod === "profile" || task.id === 2;
    const isPoints = vMethod === "points" || task.id === 5;

    if (isReferral) {
      const isEligible = referralCount > 0 || referrals.length > 0;
      if (!isEligible) {
        setVerifyError("Referral not found. Please ensure at least 1 friend has registered using your unique link.");
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
        setVerifyError("Profile details incomplete. Please ensure bio, avatar image, and µID are updated.");
        setVerifyingTaskId(null);
        return;
      } else if ((player?.predictions_count || 0) === 0) {
        setVerifyError("Prediction not found. Please ensure you have made at least 1 prediction.");
        setVerifyingTaskId(null);
        return;
      }
    } else if (isPoints) {
      const isEligible = (player?.mu_points || 0) >= 20;
      if (!isEligible) {
        setVerifyError("Insufficient points. Please accumulate a total of at least 20 μPoints.");
        setVerifyingTaskId(null);
        return;
      }
    }

    try {
      const res = await fetch(`/api/v1/tasks/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: task.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer((prev) => {
          const currentTasks = prev.tasks || {};
          return {
            ...prev,
            mu_points: (prev.mu_points || 0) + (task.mupoint || 0),
            tasks: {
              ...currentTasks,
              [`task${task.id}`]: true,
            },
          };
        });

        fetchDbTasks(currentPage, selectedCategory);
        setVerifySuccess(data.message || `Task ${task.id} verified and updated!`);
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

  if (loading || !admin) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const mergedTasks = dbTasksList
    .map((dbTask) => {
      const completed = !!dbTask.completed;

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
            {levelsData.map((lvl) => (
              <div key={lvl.level} className="text-[11px] text-slate-300 leading-normal flex flex-col">
                <span className="font-bold text-slate-100">Level {lvl.level}: {lvl.title}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{lvl.description}</span>
              </div>
            ))}
          </div>
        </div>
      ) : dbTask.guidelines ? (() => {
        const safe = DOMPurify.sanitize(dbTask.guidelines, {
          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'code', 'pre', 'blockquote'],
          ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
        });
        return <div dangerouslySetInnerHTML={{ __html: safe }} />;
      })() : (
        <p className="text-[10px] text-slate-300">{dbTask.description}</p>
      );

      const actionUrl =
        dbTask.action_url && dbTask.action_url.startsWith("/profile")
          ? `/profile/${player?.user_id}`
          : dbTask.action_url || "#";

      let totalMuPoints = dbTask.mupoint || 0;
      if (dbTask.sub_levels && Array.isArray(dbTask.sub_levels) && dbTask.sub_levels.length > 0) {
        totalMuPoints += dbTask.sub_levels.reduce((sum, sl) => sum + (sl.mupoint || 0), 0);
      }

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
      };
    })
    .sort((a, b) => a.id - b.id);

  const completedCount = overallCompleted;
  const totalCount = overallTotal;

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10 min-h-screen text-white bg-[#030207] p-4 md:p-6 rounded-3xl overflow-hidden shadow-2xl">
      {/* Stadium ambient background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.25] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#030207]/40 via-[#030207]/20 to-[#030207]/90 pointer-events-none" />

      {/* Preview mode notification banner */}
      <div className="relative z-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950 font-black animate-pulse text-sm">
            !
          </span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Admin Preview Arena
            </span>
            <span className="text-[10px] text-slate-300 mt-0.5">
              Viewing all public and preview (unapproved) challenges. Layout is identical to what players see.
            </span>
          </div>
        </div>
        {player.user_id === "mock-admin-preview-user" && (
          <span className="bg-amber-400/25 border border-amber-400/20 text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Mock Profile Mode
          </span>
        )}
      </div>

      {/* TOP N ARENA BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        <div className="relative z-10">
          <Header />
        </div>

        <div className="relative z-10">
          <Stats
            completedCount={completedCount}
            totalCount={totalCount}
            completedPoints={overallCompletedPoints}
          />
        </div>
      </div>

      {/* CHALLENGES LIST */}
      <div className="flex flex-col gap-5 relative z-10 px-2 md:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start w-full justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white">
                PREVIEW CHALLENGES
              </h2>
            </div>

            <div className="w-full sm:w-auto flex flex-wrap gap-2 sm:gap-3 bg-white/5 border border-white/5 p-1 rounded-xl">
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

        <div className="max-w-[1098px] mx-auto w-full">
          {mergedTasks.length === 0 ? (
            <ComingSoonCard category={selectedCategory} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-stretch">
              {mergedTasks.map((task) => (
                <div key={task.id} className="flex h-full relative group">
                  {/* Visual visibility tag overlay */}
                  <div className="absolute top-3 right-3 z-20">
                    {task.visibility === "public" ? (
                      <span className="bg-emerald-500/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-400/35 shadow-md">
                        Public / Approved
                      </span>
                    ) : (
                      <span className="bg-amber-500/80 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/35 shadow-md">
                        Preview / Draft
                      </span>
                    )}
                  </div>
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
      <div className="relative z-10 border-t border-white/5 pt-8 px-2 md:px-4">
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
