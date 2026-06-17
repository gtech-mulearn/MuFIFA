import Link from "next/link";

export default function ChallengeCard({ task, onViewDetails, dbTasks }) {
  const isCompleted = task.completed;
  const isLocked = task.isLocked;

  // Icons mapping based on task ID
  const renderIcon = () => {
    if (isLocked) {
      return (
        <div className="w-14 h-14 rounded-full bg-slate-900/60 border border-slate-700/20 flex items-center justify-center text-slate-500 shadow-inner">
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
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
      );
    }

    const iconClasses =
      "w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]";

    switch (task.id) {
      case 1: // Referral
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <svg
              className={iconClasses}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
        );
      case 2: // Profile
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 border border-cyan-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <svg
              className={iconClasses}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        );
      case 3: // GitHub
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-700 border border-fuchsia-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]">
            <svg
              className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
          </div>
        );
      case 4: // Predictions
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 to-red-700 border border-rose-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]">
            <svg
              className={iconClasses}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
        );
      case 5: // Points
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 border border-amber-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <svg
              className={iconClasses}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case 6: // Discord
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 border border-indigo-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <svg
              className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-400/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <svg
              className={iconClasses}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        );
    }
  };

  // Border and accent styling based on state
  const borderClass = isCompleted
    ? "border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
    : isLocked
      ? "border-white/5 opacity-55 select-none"
      : "border-violet-500/35 hover:border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.05)]";

  const glowBg = isCompleted
    ? "from-[#081510] to-[#04080a]"
    : isLocked
      ? "from-[#07060f] to-[#04030a]"
      : "from-[#0d0a20] to-[#04030a]";

  return (
    <div
      className={`flex flex-col bg-gradient-to-b ${glowBg} border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${borderClass} h-full justify-between`}
    >
      {/* Top Section: Icon (left) + Text Details (right) */}
      <div className="flex gap-4 items-start">
        <div className="relative shrink-0 select-none">
          {renderIcon()}
          {isCompleted && (
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#090A0F] flex items-center justify-center text-white shadow-md">
              <svg
                className="w-3 h-3"
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
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-left min-w-0">
          <h3
            className={`text-sm font-black tracking-wide uppercase leading-tight ${isLocked ? "text-slate-500" : "text-white"}`}
          >
            {task.title}
          </h3>
          <p className="text-[12px] text-slate-400 font-medium leading-relaxed mt-0.5 min-h-[56px] max-h-[56px] overflow-hidden">
            {task.shortDesc}
          </p>
        </div>
      </div>

      {/* Middle/Bottom Row: Status (left) + Reward Badge (right) */}
      <div className="flex items-center justify-between gap-4 mt-5 border-t border-white/5 pt-4">
        {/* Left Side: Status */}
        <div className="flex-1 min-w-0">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-emerald-400 select-none">
              <span className="text-[9px] font-black uppercase tracking-wider">
                COMPLETED
              </span>
              <svg
                className="w-3.5 h-3.5"
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
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1.5 text-slate-500 select-none">
              <svg
                className="w-3.5 h-3.5 shrink-0"
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
              <span className="text-[7.5px] font-black uppercase tracking-wider leading-tight">
                COMPLETE TIER {task.tier - 1} TO UNLOCK
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-wider">
                <span>Progress</span>
                <span>
                  {task.id === 1
                    ? task.completed
                      ? "1/1"
                      : "0/1"
                    : task.id === 4
                      ? "0/3"
                      : "0/1"}
                </span>
              </div>
              <div className="w-full bg-[#151225] h-1 rounded-full overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full w-[25%]" />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Points Badge */}
        <div
          className={`border ${
            isCompleted
              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
              : isLocked
                ? "border-slate-800 bg-slate-900/10 text-slate-600"
                : "border-violet-500/25 bg-violet-500/5 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
          } px-3 py-1 rounded-xl flex flex-col items-center justify-center shrink-0 min-w-[68px] h-[48px] select-none`}
        >
          <span className="text-sm font-black tracking-tight leading-none">
            {task.mupoint > 0 ? `+${task.mupoint}` : "0"}
          </span>
          <span className="text-[7px] font-black tracking-widest mt-1">
            μPoints
          </span>
        </div>
      </div>

      {/* Button Row */}
      {!isLocked && (
        <div className="mt-4 pt-1">
          <button
            onClick={() => onViewDetails(task)}
            className={`w-full py-3.5 text-[9px] font-black tracking-widest uppercase rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isCompleted
                ? "bg-[#0b2b1a] border-emerald-500/35 hover:bg-emerald-500/20 text-emerald-400"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md hover:from-violet-500 hover:to-indigo-500"
            }`}
          >
            <span>VIEW DETAILS</span>
          </button>
        </div>
      )}
    </div>
  );
}
