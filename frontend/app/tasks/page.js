"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TasksPage() {
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(1); // Task 1 expanded by default
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");

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

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setPlayer(data.data);
          fetchReferrals();
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
    if (!task.completed) {
      if (task.id === 1) {
        setVerifyError("Referral not found. Please ensure at least 1 friend has registered using your unique link.");
      } else if (task.id === 2) {
        setVerifyError("Profile details incomplete. Please ensure both your bio and college/institution are updated on your profile.");
      } else if (task.id === 3) {
        setVerifyError("GitHub link missing. Please ensure your GitHub profile is connected in your profile settings.");
      }
      setVerifyingTaskId(null);
      return;
    }

    try {
      // 2. Prepare tasks payload
      const existingTasks = typeof player.tasks === "object" 
        ? (player.tasks || {}) 
        : {};
      const updatedTasks = {
        ...existingTasks,
        [`task${task.id}`]: true,
      };

      // 3. Patch the registrations table
      const res = await fetch(`/api/v1/profile/${player.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updatedTasks }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer((prev) => ({
          ...prev,
          tasks: updatedTasks,
        }));
        setVerifySuccess(`Task ${task.id} verified and updated in database!`);
        setTimeout(() => setVerifySuccess(""), 4000);
      } else {
        setVerifyError(data.error || "Failed to update task completion in database.");
      }
    } catch (err) {
      console.error("Task verification failed:", err);
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifyingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#07080e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
      </div>
    );
  }

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

  // Task 1 Completion Condition: Referral task count > 0 or has referred players list length > 0
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
  const isTask1Completed = referralCount > 0 || referrals.length > 0 || !!dbTasks.task1;

  // Task 2 Completion Condition: Profile bio and institution/college is updated
  const isTask2Completed = (!!(
    player?.bio &&
    player.bio.trim().length > 0 &&
    (player?.institution || player?.college || "").trim().length > 0
  )) || !!dbTasks.task2;

  // Task 3 Completion Condition: GitHub link is set in socials
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
  const isTask3Completed = githubUser.trim().length > 0 || !!dbTasks.task3;

  // Setup Tasks Structure
  const tasks = [
    {
      id: 1,
      title: "Referral Program Challenge",
      shortDesc: "Invite a minimum of 1 user to μFIFA and gain +5 points to level up your favorite team.",
      longDesc: (
        <ul className="flex flex-col gap-2.5 text-[11px] text-slate-300 leading-relaxed list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Generate your unique pass referral link from the dashboard.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Invite a minimum of 1 user to register for μFIFA'26 using your link.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Once they successfully register, you gain +5 μPoints and level up your favorite team.</span>
          </li>
        </ul>
      ),
      reward: (
        <span>
          Earn <span className="text-[#FBBF24] font-black">+5 μPoints</span> to level up your favorite team.
        </span>
      ),
      completed: isTask1Completed,
      actionLabel: "Go to Dashboard",
      actionUrl: "/dashboard/#ref-prgrm",
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499c.172-.436.782-.436.954 0l2.22 4.5 4.931.717c.477.069.667.654.321.992l-3.57 3.48.843 4.912c.082.476-.418.839-.843.615l-4.41-2.318-4.41 2.318c-.425.224-.925-.139-.843-.615l.843-4.912-3.57-3.48c-.346-.338-.156-.923.321-.992l4.93-.717 2.22-4.5z"
          />
        </svg>
      ),
      visual: (
        <div className="relative w-full h-[170px] flex items-center justify-center overflow-hidden">
          {/* Confetti Micro-particles */}
          <div className="absolute w-1 h-1 rounded-full bg-indigo-400 top-4 left-6 opacity-70" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-pink-500 top-8 right-12 opacity-60" />
          <div className="absolute w-2 h-2 rounded-full bg-yellow-400 bottom-6 left-10 opacity-30" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 bottom-8 right-6 opacity-70" />
          <div className="absolute w-1 h-1 rounded-full bg-purple-400 top-1/2 left-2 opacity-60" />
          
          {/* Access Passes Visual */}
          <img
            src="/ticket.png"
            className="absolute w-[105px] h-[160px] object-contain rounded-lg shadow-2xl transform -rotate-[15deg] -translate-x-6 z-10 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
            alt="Ticket Pass"
          />
          <img
            src="/ticket.png"
            className="absolute w-[105px] h-[160px] object-contain rounded-lg shadow-2xl transform rotate-[10deg] translate-x-6 z-20 filter drop-shadow-[0_8px_25px_rgba(99,102,241,0.35)]"
            alt="Ticket Pass Active"
          />
        </div>
      ),
    },
    {
      id: 2,
      title: "Profile Page Update",
      shortDesc: "Customize your profile and add a bio.",
      longDesc: (
        <ul className="flex flex-col gap-2.5 text-[11px] text-slate-300 leading-relaxed list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Verify your credentials by personalizing your profile settings.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Open your Player Profile tab and click on the "Edit Details" menu.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Input your college/institution alongside a biography describing your specialization.</span>
          </li>
        </ul>
      ),
      reward: (
        <span>
          Unlock specialization details & verify your pass credentials.
        </span>
      ),
      completed: isTask2Completed,
      actionLabel: "Go to Profile",
      actionUrl: `/profile/${player?.user_id}`,
      icon: (
        <svg
          className="w-5 h-5 text-cyan-400"
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
      ),
      visual: (
        <div className="relative w-full h-[120px] flex items-center justify-center overflow-hidden">
          {/* Profile Card Mockup */}
          <div className="absolute w-[120px] h-[80px] bg-gradient-to-b from-[#181d33] to-[#0e111f] border border-cyan-500/20 rounded-xl shadow-2xl transform -rotate-[8deg] -translate-x-2 z-10 flex flex-col p-2 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[7px] font-black text-cyan-400">👤</div>
              <div className="flex flex-col">
                <span className="text-[6px] font-black text-white leading-none">PLAYER PROFILE</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-1 mt-1">
              <div className="w-10 h-1 bg-white/10 rounded-full" />
              <div className="w-14 h-1 bg-white/10 rounded-full" />
              <div className="w-8 h-1 bg-white/10 rounded-full" />
            </div>
          </div>
          {/* Floating Stats Visual */}
          <div className="absolute w-[90px] h-[70px] bg-[#1c223c]/90 border border-indigo-500/30 rounded-xl shadow-2xl transform rotate-[12deg] translate-x-10 translate-y-1.5 z-20 flex flex-col p-2 justify-between filter drop-shadow-[0_8px_25px_rgba(79,70,229,0.3)]">
            <span className="text-[5px] font-black text-slate-400 tracking-wider">BIO DETAILS</span>
            <div className="flex items-end gap-1 h-6 mt-1 border-b border-white/5 pb-1">
              <div className="w-2 bg-indigo-500/40 rounded-t h-3" />
              <div className="w-2 bg-[#6366f1] rounded-t h-5" />
              <div className="w-2 bg-indigo-500/70 rounded-t h-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "GitHub Contribution",
      shortDesc: "Fork the repository, create your player card in the /profile directory, and open a Pull Request.",
      longDesc: (
        <ul className="flex flex-col gap-2.5 text-[11px] text-slate-300 leading-relaxed list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Fork the repository to your own GitHub profile.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Create a new Markdown file inside the <code>/profile</code> directory, named using your MUID (e.g. <code>profile/yourname@mulearn.md</code>).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0 mt-0.5">•</span>
            <span>Fill out your profile, link your Discord profile card embed, and open a Pull Request targeting the main branch.</span>
          </li>
        </ul>
      ),
      reward: (
        <span>
          Earn community ranking, link your socials, and put your profile on the pitch.
        </span>
      ),
      completed: false, // verification code will be done later
      actionLabel: "Go to Repository",
      actionUrl: "https://github.com/gtech-mulearn/mufifa-2026",
      icon: (
        <svg
          className="w-5 h-5 text-purple-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
          />
        </svg>
      ),
      visual: (
        <div className="relative w-full h-[120px] flex items-center justify-center overflow-hidden">
          {/* GitHub Logo Backing Icon */}
          <div className="absolute text-purple-500/5 text-6xl font-black select-none pointer-events-none transform -rotate-12 z-0">
            &lt;/&gt;
          </div>
          {/* Contribution Blocks Mockup */}
          <div className="absolute bg-gradient-to-b from-[#181d33] to-[#0e111f] border border-purple-500/20 rounded-xl shadow-2xl p-2.5 transform rotate-[6deg] z-10 flex flex-col gap-1.5 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center border-b border-white/5 pb-1">
              <span className="text-[5px] font-black text-purple-400 tracking-widest uppercase">CONTRIBUTION GRAPH</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              <div className="w-2.5 h-2.5 rounded bg-purple-900/40 border border-purple-500/20" />
              <div className="w-2.5 h-2.5 rounded bg-purple-600/60 border border-purple-400/30" />
              <div className="w-2.5 h-2.5 rounded bg-purple-500 border border-purple-300/40 shadow-[0_0_6px_rgba(168,85,247,0.4)] animate-pulse" />
              <div className="w-2.5 h-2.5 rounded bg-purple-900/40 border border-purple-500/20" />
              <div className="w-2.5 h-2.5 rounded bg-purple-700/80 border border-purple-400/30" />
              <div className="w-2.5 h-2.5 rounded bg-purple-500 border border-purple-300/40 shadow-[0_0_6px_rgba(168,85,247,0.4)]" />
              
              <div className="w-2.5 h-2.5 rounded bg-purple-700/80 border border-purple-400/30" />
              <div className="w-2.5 h-2.5 rounded bg-purple-900/40 border border-purple-500/20" />
              <div className="w-2.5 h-2.5 rounded bg-purple-900/40 border border-purple-500/20" />
              <div className="w-2.5 h-2.5 rounded bg-purple-500 border border-purple-300/40 shadow-[0_0_6px_rgba(168,85,247,0.4)]" />
              <div className="w-2.5 h-2.5 rounded bg-purple-900/40 border border-purple-500/20" />
              <div className="w-2.5 h-2.5 rounded bg-purple-600/60 border border-purple-400/30" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Process tasks with lock and render states
  const processedTasks = tasks.map((task, i) => {
    const isUnlocked = i === 0 || tasks[i - 1].completed;
    const isLocked = !isUnlocked;
    const isPrevUnlocked = i > 0 && (i === 1 || tasks[i - 2]?.completed);
    const shouldRender = isUnlocked || isPrevUnlocked;
    return {
      ...task,
      isLocked,
      shouldRender,
    };
  });

  const visibleTasks = processedTasks.filter((t) => t.shouldRender);
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full min-h-screen bg-[#07050f]/98 text-white flex flex-col font-sans relative select-none pb-24 pt-20 md:pt-24 overflow-hidden">
      {/* Stadium background overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.24] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg.png')` }}
      />

      {/* Decorative ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.14)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.12)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex flex-col gap-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="max-w-xl">
            <h1 className="text-xl sm:text-2xl font-black tracking-[0.18em] text-white uppercase leading-none">
              ARENA PROGRESSION <span className="bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent">CHALLENGES</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-3 leading-relaxed">
              Complete active challenges sequentially to unlock achievement tiers and advance your placement.
            </p>
          </div>

          {/* Progress Card (Floating Top-Right style) */}
          <div className="flex flex-col gap-2 bg-[#121625]/60 border border-white/5 backdrop-blur-md px-5 py-4 rounded-2xl w-full md:w-56 shadow-[0_12px_36px_rgba(0,0,0,0.5)] shrink-0 self-start md:self-auto">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Task Progress</span>
              <span className="text-[#FBBF24] font-black text-xs">
                {completedCount}/{tasks.length}
              </span>
            </div>
            <div className="w-full bg-[#1b2034] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Progression Column Container */}
        <div className="flex flex-col gap-5">
          {visibleTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`bg-gradient-to-b border rounded-3xl backdrop-blur-md transition-all duration-300 overflow-hidden flex flex-col relative ${
                  task.isLocked
                    ? "from-[#0e101b]/40 to-[#090b12]/40 border-white/5 opacity-45 select-none"
                    : isExpanded
                    ? "from-[#111322] to-[#0c0d16] border-[#4f46e5]/40 shadow-[0_0_35px_rgba(79,70,229,0.12)]"
                    : "from-[#111322]/80 to-[#0c0d16]/80 border-white/10 hover:border-white/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                }`}
              >
                {/* Accordion Trigger Head */}
                <button
                  onClick={() => {
                    if (task.isLocked) return;
                    handleExpandTask(task.id);
                  }}
                  className={`w-full flex items-center justify-between p-5 text-left focus:outline-none group ${
                    task.isLocked ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Circle badge */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      task.isLocked
                        ? "bg-slate-800/30 border border-slate-700/20"
                        : task.completed
                        ? "bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                    }`}>
                      {task.isLocked ? (
                        <svg
                          className="w-4.5 h-4.5 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      ) : task.completed ? (
                        <svg
                          className="w-4.5 h-4.5 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4.5 h-4.5 text-indigo-400 animate-pulse"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                        task.isLocked ? "text-slate-500" : "text-purple-400"
                      }`}>
                        TASK {task.id}
                      </span>
                      <h3 className={`text-sm sm:text-base font-extrabold transition-colors truncate mt-0.5 ${
                        task.isLocked ? "text-slate-500" : "text-white"
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`text-[10px] font-medium truncate mt-0.5 ${
                        task.isLocked ? "text-slate-600" : "text-slate-400"
                      }`}>
                        {task.isLocked ? "Customize your profile and add a bio." : task.shortDesc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {task.isLocked ? (
                      <span className="text-[9px] font-black text-slate-500 bg-slate-800/40 border border-slate-700/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                        LOCKED
                      </span>
                    ) : task.completed ? (
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        COMPLETED
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        ACTIVE
                      </span>
                    )}

                    {/* Expand/Collapse Chevron */}
                    {!task.isLocked && (
                      <svg
                        className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Accordion Expandable Details View */}
                {!task.isLocked && isExpanded && (
                  <div className="px-6 pb-8 pt-4 border-t border-white/5 bg-black/10 flex flex-col gap-6 animate-in slide-in-from-top-3 duration-250">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Left: Guidelines & Reward */}
                      <div className="md:col-span-7 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] uppercase font-black tracking-[0.2em] text-purple-400">
                            CHALLENGE GUIDELINES
                          </span>
                          <div className="mt-1">
                            {task.longDesc}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4 mt-2">
                          <span className="text-[9px] uppercase font-black tracking-[0.2em] text-amber-500">
                            COMPLETION REWARD
                          </span>
                          <span className="text-[11px] text-slate-200 font-semibold leading-normal">
                            {task.reward}
                          </span>
                        </div>
                      </div>

                      {/* Right: Graphic & Action Button */}
                      <div className="md:col-span-5 flex flex-col justify-between items-center gap-6 relative min-h-[160px] w-full">
                        {/* Custom visual mockup */}
                        <div className="w-full flex justify-center">
                          {task.visual}
                        </div>

                        {verifyError && verifyingTaskId === null && expandedTaskId === task.id && (
                          <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] py-2 px-3.5 rounded-xl text-center select-text">
                            {verifyError}
                          </div>
                        )}
                        {verifySuccess && verifyingTaskId === null && expandedTaskId === task.id && (
                          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] py-2 px-3.5 rounded-xl text-center">
                            {verifySuccess}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 w-full justify-end items-center mt-auto">
                          {/* Verify Button */}
                          {task.id !== 3 && (
                            <button
                              onClick={() => handleVerifyTask(task)}
                              disabled={verifyingTaskId === task.id || dbTasks[`task${task.id}`]}
                              className="cursor-pointer w-full sm:w-auto px-6 py-3.5 border border-[#10b981]/40 hover:border-[#10b981] text-[#10b981] font-black text-[10px] tracking-widest uppercase rounded-full flex items-center justify-center transition-all bg-[#10b981]/5 hover:bg-[#10b981]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {verifyingTaskId === task.id ? "Verifying..." : dbTasks[`task${task.id}`] ? "Verified" : "Verify Task"}
                            </button>
                          )}

                          {/* Action Button */}
                          <Link
                            href={task.actionUrl}
                            className="group cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[10px] tracking-widest uppercase rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-center"
                          >
                            <span>{task.actionLabel}</span>
                            <svg
                              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.8"
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
                )}

                {/* Completed Stamp Overlay */}
                {task.completed && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-emerald-950/5 backdrop-blur-[0.5px]">
                    <div className="relative border-[5px] border-[#10b981]/90 text-[#10b981]/90 font-black text-2xl sm:text-3xl tracking-[0.25em] uppercase px-8 py-2.5 rounded-2xl transform -rotate-[12deg] shadow-[0_0_25px_rgba(16,185,129,0.25)] select-none animate-in zoom-in-75 duration-300 scale-90 sm:scale-100 bg-[#07050f]/90 flex items-center justify-center overflow-hidden">
                      COMPLETED
                      {/* Scratch lines to simulate distressed/broken stamp effect */}
                      <div className="absolute top-0 bottom-0 left-[18%] w-[2.5px] bg-[#07050f] transform rotate-[35deg] opacity-90" />
                      <div className="absolute top-0 bottom-0 left-[48%] w-[3.5px] bg-[#07050f] transform rotate-[42deg] opacity-85" />
                      <div className="absolute top-0 bottom-0 left-[78%] w-[2px] bg-[#07050f] transform rotate-[28deg] opacity-90" />
                      <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-[#07050f] transform -rotate-[12deg] opacity-80" />
                      <div className="absolute bottom-[35%] left-0 right-0 h-[2.5px] bg-[#07050f] transform -rotate-[8deg] opacity-85" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
