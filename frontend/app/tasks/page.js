"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Redesigned components
import Header from "./components/Header/Header";
import Stats from "./components/Stats/Stats";
import Timeline from "./components/Timeline/Timeline";
import ChallengeCard from "./components/ChallengeCard/ChallengeCard";
import Rewards from "./components/Rewards/Rewards";
import ComingSoonCard from "./components/ComingSoonCard";
import VideoOverlay from "./components/VideoOverlay";
import TierSelector from "./components/TierSelector";

export default function TasksPage() {
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(1); // Task 1 expanded by default
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [activeTier, setActiveTier] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const unlockInProgressRef = useRef(false);
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setPlayer(data.data);
          fetchReferrals();
          fetchDbTasks();
          
          // Auto-select Tier 2 if already unlocked
          const userTasks = (() => {
            const rawTasks = data.data.tasks;
            if (!rawTasks) return {};
            if (typeof rawTasks === "object") return rawTasks;
            try {
              return JSON.parse(rawTasks);
            } catch {
              return {};
            }
          })();
          if (userTasks.level2_unlocked) {
            setActiveTier(2);
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Tasks auth check error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        setPlayer(null);
        router.push("/login");
      } else {
        console.error("Logout failed.");
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
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
  const isLevel1Completed = isTask1Completed && isTask2Completed && isTask3Completed;

  // --- Tier 2 Completion Conditions ---
  const isTask4Completed = (player?.predictions_count || 0) >= 3 || isDbTaskCompleted(4);
  const isTask5Completed = (player?.mu_points || 0) >= 20 || isDbTaskCompleted(5);

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
  const isTask6Completed = (!!discordUser && discordUser.trim().length > 0) || isDbTaskCompleted(6);

  const handleExpandTask = (taskId) => {
    setVerifyError("");
    setVerifySuccess("");
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleVerifyTask = async (task) => {
    setVerifyError("");
    setVerifySuccess("");
    setVerifyingTaskId(task.id);

    // 1. Check if the task criteria is met locally
    if (task.id === 1) {
      const isEligible = referralCount > 0 || referrals.length > 0;
      if (!isEligible) {
        setVerifyError("Referral not found. Please ensure at least 1 friend has registered using your unique link.");
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 2) {
      const isProfileComplete = !!(
        player?.bio &&
        player.bio.trim().length > 0 &&
        (player?.institution || player?.college || "").trim().length > 0 &&
        player?.avatar_url &&
        player.avatar_url.trim().length > 0
      );
      if (!isProfileComplete) {
        setVerifyError("Profile details incomplete. Please ensure bio, college/institution, and avatar image are updated on your profile.");
        setVerifyingTaskId(null);
        return;
      } else if (!hasPredictions) {
        setVerifyError("Prediction not found. Please ensure you have made at least 1 prediction on any match.");
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 4) {
      const isEligible = (player?.predictions_count || 0) >= 3;
      if (!isEligible) {
        setVerifyError("Predictions incomplete. Please make at least 3 predictions on any matches.");
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 5) {
      const isEligible = (player?.mu_points || 0) >= 20;
      if (!isEligible) {
        setVerifyError("Insufficient points. Please accumulate a total of at least 20 μPoints.");
        setVerifyingTaskId(null);
        return;
      }
    } else if (task.id === 6) {
      const isEligible = !!discordUser && discordUser.trim().length > 0;
      if (!isEligible) {
        setVerifyError("Discord link not found. Please add your Discord username under socials in your profile settings.");
        setVerifyingTaskId(null);
        return;
      }
    }

    try {
      // Call the verify task API endpoint to complete tasks in user_completed_tasks
      const res = await fetch(`/api/v1/tasks/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: task.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer((prev) => {
          const currentTasks = (() => {
            if (!prev.tasks) return {};
            if (typeof prev.tasks === "object") return prev.tasks;
            try { return JSON.parse(prev.tasks); } catch { return {}; }
          })();
          return {
            ...prev,
            mu_points: (prev.mu_points || 0) + (task.mupoint || 0),
            tasks: {
              ...currentTasks,
              [`task${task.id}`]: true,
            }
          };
        });

        // Refetch database tasks list to sync the UI completion state immediately
        fetchDbTasks();

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
        setActiveTier(2); // Auto-navigate to Level 2
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#05030a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Define challenges arrays using database values when available, falling back to local structures
  const mergedTasks = (() => {
    // Default fallback hardcoded tasks
    const fallbackTasks = [
      {
        id: 1,
        title: "Referral Program Challenge",
        shortDesc: "Invite a minimum of 1 user to μFIFA and gain +5 points to level up your favorite team.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Generate your unique pass referral link from the dashboard.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Invite a minimum of 1 user to register for μFIFA'26 using your link.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Once they successfully register, you gain +5 μPoints and level up your favorite team.</span>
            </li>
          </ul>
        ),
        reward: "Earn +5 μPoints to level up your favorite team.",
        completed: isTask1Completed,
        actionLabel: "Go to Dashboard",
        actionUrl: "/dashboard",
        tier: 1,
      },
      {
        id: 2,
        title: "Profile Page Update",
        shortDesc: "Customize your profile, add a bio, and make at least 1 prediction.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Verify your credentials by personalizing your profile settings.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Open your Player Profile tab and click on the \"Edit Details\" menu.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Input your college/institution alongside a biography describing your specialization.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Submit at least 1 prediction on the match dashboard (outcome doesn't matter).</span>
            </li>
          </ul>
        ),
        reward: "Unlock specialization details & verify your pass credentials.",
        completed: isTask2Completed,
        actionLabel: "Go to Profile",
        actionUrl: `/profile/${player?.user_id}`,
        tier: 1,
      },
      {
        id: 3,
        title: "GitHub Contribution",
        shortDesc: "Fork the repository, create your player card in the /profile directory, and open a Pull Request.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Fork the repository to your own GitHub profile.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Create a new Markdown file inside the <code>/profile</code> directory, named using your MUID (e.g. <code>profile/yourname@mulearn.md</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fuchsia-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Fill out your profile, link your Discord profile card embed, and open a Pull Request targeting the main branch.</span>
            </li>
          </ul>
        ),
        reward: "Earn community ranking, link your socials, and put your profile on the pitch.",
        completed: isTask3Completed,
        actionLabel: "Go to Repository",
        actionUrl: "https://github.com/gtech-mulearn/mufifa-2026",
        tier: 1,
      },
      {
        id: 4,
        title: "Match Day Tactician",
        shortDesc: "Submit at least 3 match predictions to test your strategic intuition.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Navigate to the Match Fixtures page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Submit a minimum of 3 separate match predictions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Verify here once completed to log your progress.</span>
            </li>
          </ul>
        ),
        reward: "Unlock strategic badges on your scorecard.",
        completed: isTask4Completed,
        actionLabel: "Predict Matches",
        actionUrl: "/match",
        tier: 2,
      },
      {
        id: 5,
        title: "Squad Synergy Challenge",
        shortDesc: "Accumulate a total of 20 μPoints on your profile scorecard.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Participate in referrals and predictions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Earn a total of 20 μPoints on your scorecard.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Verify your total points below.</span>
            </li>
          </ul>
        ),
        reward: "Increase your community rank and level up your team.",
        completed: isTask5Completed,
        actionLabel: "View Leaderboard",
        actionUrl: "/leaderboard",
        tier: 2,
      },
      {
        id: 6,
        title: "Discord Integration",
        shortDesc: "Add your Discord username/tag in your profile socials.",
        longDesc: (
          <ul className="flex flex-col gap-2.5 text-[10px] text-slate-300 leading-relaxed list-none pl-0">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Navigate to your profile page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Enter your Discord username under socials in the \"Edit Details\" panel.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
              <span>Click verify to register your Discord membership status.</span>
            </li>
          </ul>
        ),
        reward: "Unlock premium Discord roles and special access.",
        completed: isTask6Completed,
        actionLabel: "Link Socials",
        actionUrl: `/profile/${player?.user_id}`,
        tier: 2,
      },
    ];

    // Create a lookup map for DB tasks
    const dbTasksMap = {};
    dbTasksList.forEach((t) => {
      dbTasksMap[t.id] = t;
    });

    const mergedList = [];

    // 1. Process all fallback tasks, overriding with DB values if available
    fallbackTasks.forEach((fbTask) => {
      const dbTask = dbTasksMap[fbTask.id];
      if (dbTask) {
        let completed = fbTask.completed || !!dbTask.completed;
        
        let longDesc = null;
        if (dbTask.guidelines) {
          longDesc = <div dangerouslySetInnerHTML={{ __html: dbTask.guidelines }} />;
        } else {
          longDesc = fbTask.longDesc;
        }

        let rewardText = `Earn +${dbTask.mupoint || 0} μPoints & custom XP breakdown.`;

        // Handle profile URL mapping dynamically for user ID redirect
        const actionUrl = (dbTask.action_url && dbTask.action_url.startsWith('/profile'))
          ? `/profile/${player?.user_id}`
          : (dbTask.action_url || fbTask.actionUrl);

        mergedList.push({
          id: fbTask.id,
          title: dbTask.title || fbTask.title,
          shortDesc: dbTask.short_desc || dbTask.description || fbTask.shortDesc,
          longDesc,
          reward: rewardText,
          completed,
          actionLabel: dbTask.action_label || fbTask.actionLabel,
          actionUrl,
          tier: dbTask.tier || fbTask.tier,
        });
      } else {
        mergedList.push(fbTask);
      }
    });

    // 2. Append any tasks from DB that are not in fallbacks (e.g. Task 7+)
    dbTasksList.forEach((dbTask) => {
      const alreadyMerged = fallbackTasks.some((f) => f.id === dbTask.id);
      if (!alreadyMerged) {
        let completed = !!dbTask.completed;
        let longDesc = dbTask.guidelines ? (
          <div dangerouslySetInnerHTML={{ __html: dbTask.guidelines }} />
        ) : (
          <p className="text-[10px] text-slate-300">{dbTask.description}</p>
        );

        const actionUrl = (dbTask.action_url && dbTask.action_url.startsWith('/profile'))
          ? `/profile/${player?.user_id}`
          : (dbTask.action_url || "#");

        mergedList.push({
          id: dbTask.id,
          title: dbTask.title || `Challenge ${dbTask.id}`,
          shortDesc: dbTask.short_desc || dbTask.description || "",
          longDesc,
          reward: `Earn +${dbTask.mupoint || 0} μPoints & custom XP breakdown.`,
          completed,
          actionLabel: dbTask.action_label || "View Details",
          actionUrl,
          tier: dbTask.tier || 1,
        });
      }
    });

    // Sort by task ID
    mergedList.sort((a, b) => a.id - b.id);

    return mergedList;
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

  const activeTasks = activeTier === 1 ? processedLevel1Tasks : processedLevel2Tasks;
  const activeCompletedCount = activeTier === 1 ? tier1CompletedCount : tier2CompletedCount;
  const activeTotalCount = activeTier === 1 ? tier1TotalCount : tier2TotalCount;

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* TOP N ARENA BANNER (with stadium background) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: `url('/bg_imge.png')` }}
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
            activeTier={activeTier}
            completedCount={activeCompletedCount}
            totalCount={activeTotalCount}
          />
        </div>
      </div>

      {/* TIMELINE */}
      <div className="relative z-10">
        <Timeline activeTier={activeTier} level2Unlocked={!!dbTasks.level2_unlocked} />
      </div>

      {/* TIER SELECTOR & CHALLENGES LIST */}
      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.25em] text-white self-start">
            CHALLENGES
          </h2>
          <TierSelector
            activeTier={activeTier}
            setActiveTier={setActiveTier}
            level2Unlocked={!!dbTasks.level2_unlocked}
          />
        </div>

        {/* Render Active Tier Challenges */}
        {activeTier === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTasks.map((task) => (
              <ChallengeCard
                key={task.id}
                task={task}
                isExpanded={expandedTaskId === task.id}
                onExpandToggle={handleExpandTask}
                onVerify={handleVerifyTask}
                verifyingTaskId={verifyingTaskId}
                verifyError={verifyError}
                verifySuccess={verifySuccess}
                expandedTaskId={expandedTaskId}
                dbTasks={dbTasks}
              />
            ))}
          </div>
        )}

        {activeTier === 2 && (
          dbTasks.level2_unlocked ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTasks.map((task) => (
                <ChallengeCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskId === task.id}
                  onExpandToggle={handleExpandTask}
                  onVerify={handleVerifyTask}
                  verifyingTaskId={verifyingTaskId}
                  verifyError={verifyError}
                  verifySuccess={verifySuccess}
                  expandedTaskId={expandedTaskId}
                  dbTasks={dbTasks}
                />
              ))}
            </div>
          ) : isLevel1Completed ? (
            /* Tier 2 Unlock Button Component */
            <div className="flex flex-col items-center justify-center p-8 bg-[#110e24]/80 border border-violet-500/10 rounded-2xl backdrop-blur-md shadow-2xl max-w-sm mx-auto w-full text-center relative overflow-hidden animate-fade-in">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                TIER 1 COMPLETED!
              </span>
              <h2 className="text-base font-black text-white uppercase tracking-wider mb-6">
                READY FOR TIER 2
              </h2>
              
              <div className="w-20 h-20 flex items-center justify-center bg-white/5 border border-white/10 rounded-full mb-6 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium mb-6 leading-relaxed">
                Watch the arena transition sequence to unlock and begin Tier 2 progression.
              </p>

              <button
                onClick={startUnlockProcess}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[10px] tracking-widest uppercase rounded-full shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Unlock Tier 2</span>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          ) : (
            /* Tier 2 Locked Component */
            <div className="flex flex-col items-center justify-center p-8 bg-[#110e24]/30 border border-white/5 rounded-2xl backdrop-blur-md shadow-2xl max-w-sm mx-auto w-full text-center relative overflow-hidden opacity-50 select-none">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                TIER 2 PROGRESSION
              </span>
              <h2 className="text-base font-black text-slate-500 uppercase tracking-wider mb-4">
                TIER 2 LOCKED
              </h2>
              
              <div className="w-20 h-20 flex items-center justify-center bg-slate-800/10 border border-slate-700/10 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              
              <p className="text-[10px] text-slate-500 font-medium">
                Complete all Tier 1 challenges to unlock access to Tier 2 arena progression.
              </p>
            </div>
          )
        )}
      </div>

      {/* TIER REWARDS ROW */}
      <div className="relative z-10 border-t border-white/5 pt-8">
        <Rewards activeTier={activeTier} />
      </div>

      <VideoOverlay
        showVideo={showVideo}
        showCloseBtn={showCloseBtn}
        completeUnlock={completeUnlock}
      />
    </div>
  );
}
