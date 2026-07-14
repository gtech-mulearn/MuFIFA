import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import DOMPurify from "dompurify";
import { marked } from "marked";

// Configure marked to handle clean breaks
marked.setOptions({
  breaks: true,
  gfm: true
});

function parseMarkdown(text) {
  if (!text) return "";
  try {
    return marked.parse(text);
  } catch (e) {
    console.error("Markdown parsing failed:", e);
    return text;
  }
}

const getTaskLevels = (task) => {
  if (!task) return [];

  // If sub_levels exists from the database parent-child hierarchy
  if (task.sub_levels && Array.isArray(task.sub_levels) && task.sub_levels.length > 0) {
    return task.sub_levels.map((sl, index) => {
      // Calculate total XP for this sublevel
      const xpReward = (sl.xp_creativity || 0) + (sl.xp_branding || 0) + (sl.xp_innovation || 0) + (sl.xp_teamwork || 0) + (sl.xp_execution || 0);
      
      // Parse guidelines if they are defined (e.g. HTML bullet points, milestones list)
      let entries = [];
      if (sl.guidelines) {
        if (sl.guidelines.trim().startsWith("[")) {
          try {
            entries = JSON.parse(sl.guidelines);
          } catch {}
        } else {
          entries = [sl.guidelines];
        }
      }

      return {
        level: index + 1,
        id: sl.id,
        title: sl.title || `Level ${index + 1}`,
        description: sl.description || sl.short_desc || "",
        entries: entries,
        xpReward: xpReward,
        muPointsReward: sl.mupoint || 0,
        completed: sl.completed,
        isLocked: sl.isLocked,
        verification: sl.verification,
        actionUrl: sl.action_url || "#",
        actionLabel: sl.action_label || "View Details",
        xp_creativity: sl.xp_creativity || 0,
        xp_branding: sl.xp_branding || 0,
        xp_innovation: sl.xp_innovation || 0,
        xp_teamwork: sl.xp_teamwork || 0,
        xp_execution: sl.xp_execution || 0,
      };
    });
  }

  // Parse custom levels configured via DB/Admin panel JSON (legacy backup)
  if (task.guidelines && typeof task.guidelines === "string" && task.guidelines.trim().startsWith("{\"levels\":")) {
    try {
      const parsed = JSON.parse(task.guidelines);
      if (parsed && Array.isArray(parsed.levels)) {
        return parsed.levels;
      }
    } catch (e) {
      console.error("Failed to parse dynamic task guidelines levels:", e);
    }
  }
  
  return [];
};

export default function ChallengeModal({
  isOpen,
  onClose,
  task,
  onVerify,
  verifyingTaskId,
  verifyError,
  verifySuccess,
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [completedLevelsState, setCompletedLevelsState] = useState([]);

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

  const prevIsOpenRef = useRef(false);
  const prevCompletionsRef = useRef({});

  // Load levels completed status on task change or modal open
  useEffect(() => {
    if (!task) return;

    const prevIsOpen = prevIsOpenRef.current;
    if (isOpen && !prevIsOpen) {
      const taskLevels = getTaskLevels(task);
      const firstUncompleted = taskLevels.find((l) => !l.completed);
      setActiveTab(firstUncompleted ? firstUncompleted.level : 1);
    }
    prevIsOpenRef.current = isOpen;

    if (task.completed) {
      setCompletedLevelsState([1, 2, 3]);
    } else {
      const key = `mufifa_task_levels_completed_${task.id}`;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setCompletedLevelsState(JSON.parse(stored));
        } else {
          setCompletedLevelsState([]);
        }
      } catch (e) {
        console.error("Failed to load completed levels from localStorage", e);
        setCompletedLevelsState([]);
      }
    }
  }, [task, isOpen]);

  // Auto-advance to the next level when a dynamic level is completed
  useEffect(() => {
    if (!task) return;
    const taskLevels = getTaskLevels(task);
    const prevCompletions = prevCompletionsRef.current;
    
    taskLevels.forEach((lvl) => {
      const wasCompletedBefore = !!prevCompletions[lvl.id || lvl.level];
      const isCompletedNow = !!lvl.completed;

      if (isCompletedNow && !wasCompletedBefore) {
        if (activeTab === lvl.level && lvl.level < taskLevels.length) {
          setActiveTab(lvl.level + 1);
        }
      }
    });

    const currentCompletions = {};
    taskLevels.forEach((lvl) => {
      currentCompletions[lvl.id || lvl.level] = !!lvl.completed;
    });
    prevCompletionsRef.current = currentCompletions;
  }, [task, activeTab]);

  if (!task) return null;

  const levels = getTaskLevels(task);

  const markLevelCompletedLocal = (levelNum) => {
    const key = `mufifa_task_levels_completed_${task.id}`;
    let completedList = [];
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        completedList = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    if (!completedList.includes(levelNum)) {
      completedList.push(levelNum);
    }

    try {
      localStorage.setItem(key, JSON.stringify(completedList));
    } catch (e) {
      console.error(e);
    }

    setCompletedLevelsState(completedList);

    // Auto-advance to next level if available
    if (levelNum < levels.length) {
      setActiveTab(levelNum + 1);
    }
  };

  const isLevelCompleted = (levelNum, lvlObj) => {
    if (task.completed) return true;
    if (lvlObj && lvlObj.completed !== undefined) {
      return lvlObj.completed;
    }
    return completedLevelsState.includes(levelNum);
  };

  const isLevelLocked = (levelNum, lvlObj) => {
    if (lvlObj && lvlObj.isLocked !== undefined) {
      return lvlObj.isLocked;
    }
    if (levelNum === 1) return false;
    return !isLevelCompleted(levelNum - 1);
  };

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

  const activeLvlData = levels.find((l) => l.level === activeTab) || levels[0] || { title: "", description: "", entries: [], xpReward: 0, muPointsReward: 0 };

  const getVerificationDetails = (targetTask) => {
    const v = targetTask.verification;
    if (v) {
      if (v === "none" || v === "manual") {
        return {
          type: "Manual",
          description:
            "Requires manual verification and crediting by an admin.",
          colorClass: "text-rose-400 border-rose-500/20 bg-rose-500/5",
          icon: (
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
        };
      }
      if (v === "custom" || v === "referral" || v === "profile" || v === "kuzhiundo" || v === "points") {
        let desc = "Automated check via website action.";
        if (v === "referral") desc = "Automated check of your referred players.";
        if (v === "profile") desc = "Automated check of profile completeness & prediction.";
        if (v === "kuzhiundo") desc = "Automated check of Kuzhiyundo pothole submissions.";
        if (v === "points") desc = "Automated check of accumulated μPoints.";

        return {
          type: "Automated",
          description: desc,
          colorClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
          icon: (
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          ),
        };
      }
      if (v.startsWith("discord_api:") || v === "discord_api" || v === "discord api") {
        const hashtag = v.startsWith("discord_api:") ? v.substring("discord_api:".length) : "";
        return {
          type: "Discord API",
          description: `Verify via Discord by posting in the channel with hashtag: `,
          hashtag: hashtag,
          colorClass: "text-sky-400 border-sky-500/20 bg-sky-500/5",
          icon: (
            <svg
              className="w-4.5 h-4.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
          ),
        };
      }
    }
    // Fallback based on task ID for backwards compatibility
    if ([1, 2, 4, 5, 6].includes(targetTask.id)) {
      return {
        type: "Automated",
        description: "Automated check via website action.",
        colorClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
        icon: (
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        ),
      };
    }
    return {
      type: "Manual",
      description: "Requires manual verification and crediting by an admin.",
      colorClass: "text-rose-400 border-rose-500/20 bg-rose-500/5",
      icon: (
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    };
  };

  const vDetails = getVerificationDetails((levels.length > 0 && activeLvlData && activeLvlData.id) ? activeLvlData : task);
  const isVerifiable = vDetails.type !== "Manual";

  return (
    <div
      className={`challenge-modal-fixed-wrapper ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .guidelines-content h1, .guidelines-html-container h1 {
          font-size: 1.5rem !important;
          font-weight: 900 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          color: #ffffff !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          padding-bottom: 0.25rem !important;
          display: block !important;
        }
        .guidelines-content h2, .guidelines-html-container h2 {
          font-size: 1.3rem !important;
          font-weight: 850 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: #ffffff !important;
          display: block !important;
        }
        .guidelines-content h3, .guidelines-html-container h3 {
          font-size: 1.15rem !important;
          font-weight: 800 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          color: #a78bfa !important;
          display: block !important;
        }
        .guidelines-content ul, .guidelines-html-container ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
        }
        .guidelines-content ol, .guidelines-html-container ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
        }
        .guidelines-content li, .guidelines-html-container li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          line-height: 1.5 !important;
          display: list-item !important;
        }
        .guidelines-content hr, .guidelines-html-container hr {
          border: 0 !important;
          border-top: 1px solid rgba(255,255,255,0.12) !important;
          margin-top: 1.25rem !important;
          margin-bottom: 1.25rem !important;
          display: block !important;
        }
        .guidelines-content p, .guidelines-html-container p {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.6 !important;
          display: block !important;
        }
        .guidelines-content code, .guidelines-html-container code {
          background-color: rgba(139,92,246,0.15) !important;
          color: #c084fc !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-family: monospace !important;
          font-size: 0.85em !important;
          border: 1px solid rgba(139,92,246,0.2) !important;
          display: inline-block !important;
        }
        .guidelines-content pre, .guidelines-html-container pre {
          background-color: rgba(0,0,0,0.4) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          padding: 1rem !important;
          border-radius: 0.75rem !important;
          overflow-x: auto !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
          display: block !important;
        }
        .guidelines-content pre code, .guidelines-html-container pre code {
          background-color: transparent !important;
          color: inherit !important;
          padding: 0 !important;
          border: none !important;
          font-size: 0.9em !important;
          display: block !important;
        }
        .guidelines-content a, .guidelines-html-container a {
          color: #a78bfa !important;
          text-decoration: underline !important;
        }
        .guidelines-content a:hover, .guidelines-html-container a:hover {
          color: #c084fc !important;
        }
      ` }} />
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
        <div
          className={`md:absolute md:left-0 md:top-0 md:bottom-0 md:w-[35%] w-full md:h-full h-auto bg-gradient-to-br from-[#1b1544] via-[#0f0b27] to-[#04030a] p-6 py-10 md:p-8 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0 select-none transition-transform duration-500 ease-out z-10 ${
            isOpen ? "md:translate-x-0" : "md:-translate-x-full"
          }`}
        >
          {/* Stadium BG pattern */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.15] pointer-events-none"
            style={{ backgroundImage: `url('/bg_img.webp')` }}
          />
          {/* Glow */}
          <div className="absolute w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none z-0" />

          <div className={`relative z-10 flex flex-col items-center text-center gap-4 md:gap-6 ${levels.length > 0 ? "mt-auto" : "my-auto"}`}>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-violet-400">
              {levels.length > 0 ? "Active Level Rewards" : "Challenge Rewards"}
            </span>

            {/* Logo Badge (Playercard Badge) */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 shrink-0 flex items-center justify-center">
              <div className="absolute -inset-1 md:-inset-1.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 blur opacity-45 animate-pulse" />
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#121021] border border-violet-500/30 flex items-center justify-center shadow-2xl relative z-10">
                <div className="relative w-10 h-10 md:w-14 md:h-14">
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
            <div className="flex flex-row gap-3 mt-1 justify-center items-center">
              {/* points */}
              <div className="bg-[#120e2b]/80 border border-violet-500/15 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg w-24 md:w-28 select-none">
                <span className="text-xl md:text-2xl font-black text-amber-400 leading-none">
                  +{levels.length > 0 ? (activeLvlData.muPointsReward || 0) : (task.mupoint || 0)}
                </span>
                <span className="text-[8px] font-black tracking-widest text-slate-400 mt-1">
                  μPoints
                </span>
              </div>

              {/* XP */}
              <div className="bg-[#120e2b]/80 border border-violet-500/15 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg w-24 md:w-28 select-none">
                <span className="text-xl md:text-2xl font-black text-violet-400 leading-none">
                  +{levels.length > 0 ? (activeLvlData.xpReward || 0) : (task.xpValue || 0)}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                  XP Points
                </span>
              </div>
            </div>
          </div>

          {/* Level Tabs Selector (placed at the bottom of the Left Panel) */}
          {levels.length > 0 && (
            <div className="relative z-10 w-full mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 text-center">
                Levels Progression
              </span>
              <div className="flex flex-col gap-2 w-full">
                {levels.map((lvl) => {
                  const isLocked = isLevelLocked(lvl.level, lvl);
                  const isComp = isLevelCompleted(lvl.level, lvl);
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => !isLocked && setActiveTab(lvl.level)}
                      disabled={isLocked}
                      className={`w-full py-2.5 px-4 rounded-xl transition-all flex flex-col items-start gap-0.5 border ${
                        isLocked
                          ? "bg-slate-950/20 border-white/5 opacity-40 cursor-not-allowed text-slate-600"
                          : activeTab === lvl.level
                            ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20 cursor-pointer"
                            : "bg-white/2 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[11px] font-black">
                        <span className="truncate pr-2">{lvl.title}</span>
                        {isLocked ? (
                          <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        ) : isComp ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-violet-400/80 animate-ping shrink-0" />
                        )}
                      </div>
                      <div className="flex gap-2 text-[9px] font-bold opacity-80 mt-0.5">
                        <span className="text-amber-400">+{lvl.muPointsReward} μPoints</span>
                        <span className={activeTab === lvl.level ? "text-violet-200" : "text-violet-400"}>+{lvl.xpReward} XP</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Slides in from right on desktop, static stack on mobile */}
        <div
          className={`md:absolute md:right-0 md:top-0 md:bottom-0 md:w-[65%] w-full md:h-full h-auto p-6 pb-24 md:p-12 flex flex-col justify-between md:overflow-y-auto bg-[#0c0a18]/95 backdrop-blur-md transition-transform duration-500 ease-out z-10 ${
            isOpen ? "md:translate-x-0" : "md:translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-6 text-left pr-2 mt-4 md:mt-8 flex-1">
            {/* Header detail */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  {levels.length > 0 ? `Challenge ${task.id} • ${activeLvlData.title}` : `Challenge ${task.id}`}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider leading-tight">
                {task.title}
              </h2>
            </div>

            {/* Level Guidelines */}
            <div className="flex flex-col gap-4">
              <span className="text-sm font-black uppercase tracking-[0.25em] text-violet-400 border-b border-white/5 pb-2.5">
                {levels.length > 0 ? "LEVEL INSTRUCTIONS" : "CHALLENGE INSTRUCTIONS"}
              </span>
              <div className="guidelines-content text-base text-slate-200 leading-relaxed font-semibold space-y-4">
                {levels.length > 0 ? (
                  <>
                    {activeLvlData.description ? (() => {
                      const safe = DOMPurify.sanitize(parseMarkdown(activeLvlData.description), {
                        ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'code', 'pre', 'blockquote', 'hr'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
                      });
                      return <div className="text-slate-300 text-sm leading-relaxed mb-3 guidelines-html-container" dangerouslySetInnerHTML={{ __html: safe }} />;
                    })() : (
                      <p className="text-slate-300 text-sm leading-relaxed mb-3">No instructions provided.</p>
                    )}
                    {activeLvlData.entries && activeLvlData.entries.length > 0 && (
                      <div className="flex flex-col gap-2 mt-4 bg-slate-950/25 border border-white/5 p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-400">
                          Required Level Milestones:
                        </span>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                           {activeLvlData.entries.map((entry, idx) => {
                            const entryText = entry.name || entry;
                            const safeEntry = DOMPurify.sanitize(parseMarkdown(entryText), {
                              ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'a', 'span', 'code'],
                              ALLOWED_ATTR: ['href', 'target', 'rel'],
                            });
                            return (
                              <li key={idx} className="text-xs text-slate-300" dangerouslySetInnerHTML={{ __html: safeEntry }} />
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm font-medium text-slate-300 guidelines-html-container">
                    {task.guidelines ? (
                      (() => {
                        const safe = DOMPurify.sanitize(parseMarkdown(task.guidelines), {
                          ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'code', 'pre', 'blockquote', 'hr'],
                          ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
                        });
                        return <div dangerouslySetInnerHTML={{ __html: safe }} />;
                      })()
                    ) : (
                      <p>{task.description || task.shortDesc}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed XP Breakdown for Active Level / Task */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-black uppercase tracking-[0.25em] text-violet-400 border-b border-white/5 pb-2.5">
                {levels.length > 0 ? "LEVEL REWARDS" : "CHALLENGE REWARDS"}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-center">
                {[
                  { label: "Creativity", value: activeLvlData.xp_creativity || task.xp_creativity || 0, color: "text-rose-400 border-rose-500/10 bg-rose-500/5" },
                  { label: "Branding", value: activeLvlData.xp_branding || task.xp_branding || 0, color: "text-amber-400 border-amber-500/10 bg-amber-500/5" },
                  { label: "Innovation", value: activeLvlData.xp_innovation || task.xp_innovation || 0, color: "text-cyan-400 border-cyan-500/10 bg-cyan-500/5" },
                  { label: "Teamwork", value: activeLvlData.xp_teamwork || task.xp_teamwork || 0, color: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5" },
                  { label: "Execution", value: activeLvlData.xp_execution || task.xp_execution || 0, color: "text-indigo-400 border-indigo-500/10 bg-indigo-500/5" },
                ].map((item) => (
                  <div key={item.label} className={`border rounded-xl p-2 flex flex-col items-center justify-center ${item.color}`}>
                    <span className="text-sm font-black leading-none">+{item.value}</span>
                    <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Status indicator */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-black uppercase tracking-[0.25em] text-amber-500 border-b border-white/5 pb-2.5">
                {levels.length > 0 ? "LEVEL STATUS" : "CHALLENGE STATUS"}
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
                  <span>Challenge Completed</span>
                </div>
              ) : (levels.length > 0 && isLevelCompleted(activeTab, activeLvlData)) ? (
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
                  <span>Level Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-wider animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>In Progress</span>
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
            {task.completed ? (
              <div className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-black text-xs tracking-widest uppercase rounded-xl text-center flex items-center justify-center gap-2 select-none">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>CHALLENGE VERIFIED & COMPLETE</span>
              </div>
            ) : task.visibility === "disabled" ? (
              <div className="flex-1 py-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-xs tracking-widest uppercase rounded-xl text-center flex items-center justify-center gap-2 select-none">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>DEADLINE OVER • TASK DISABLED</span>
              </div>
            ) : (
              <>
                {/* Custom Level completions vs final Database verification */}
                {levels.length > 0 && activeTab < levels.length && !activeLvlData.id ? (
                  <button
                    onClick={() => markLevelCompletedLocal(activeTab)}
                    disabled={isLevelCompleted(activeTab, activeLvlData)}
                    className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLevelCompleted(activeTab, activeLvlData) ? (
                      <>
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>LEVEL {activeTab} COMPLETED</span>
                      </>
                    ) : (
                      <span>COMPLETE LEVEL {activeTab}</span>
                    )}
                  </button>
                ) : (
                  isVerifiable && (
                    <button
                      onClick={() => onVerify(levels.length > 0 ? activeLvlData : task)}
                      disabled={
                        verifyingTaskId === (levels.length > 0 ? activeLvlData.id : task.id) ||
                        isLevelCompleted(activeTab, activeLvlData) ||
                        isLevelLocked(activeTab, activeLvlData)
                      }
                      className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 hover:text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {verifyingTaskId === (levels.length > 0 ? activeLvlData.id : task.id) ? (
                        <span>VERIFYING...</span>
                      ) : isLevelCompleted(activeTab, activeLvlData) ? (
                        <span>VERIFIED & COMPLETE</span>
                      ) : (
                        <span>VERIFY LEVEL {activeTab}</span>
                      )}
                    </button>
                  )
                )}

                <Link
                  href={levels.length > 0 ? activeLvlData.actionUrl : task.actionUrl}
                  className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{levels.length > 0 ? activeLvlData.actionLabel : task.actionLabel}</span>
                  <svg
                    className="w-4.5 h-4.5"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
