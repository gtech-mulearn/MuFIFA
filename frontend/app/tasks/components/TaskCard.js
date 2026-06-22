import Link from "next/link";

export default function TaskCard({
  task,
  isExpanded,
  onExpandToggle,
  onVerify,
  verifyingTaskId,
  verifyError,
  verifySuccess,
  expandedTaskId,
  dbTasks
}) {
  return (
    <div
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
          onExpandToggle(task.id);
        }}
        className={`w-full flex items-center justify-between p-5 text-left focus:outline-none group ${
          task.isLocked ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Circle badge */}
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden ${
            task.isLocked
              ? "bg-slate-800/30 border border-slate-700/20"
              : task.completed
              ? "bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
          }`}>
            {task.logo_url ? (
              <img src={task.logo_url} alt="" className={`w-full h-full object-cover ${task.isLocked ? "grayscale opacity-50" : ""}`} />
            ) : task.isLocked ? (
              <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : task.completed ? (
              <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-indigo-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
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
              {task.shortDesc}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          {task.isLocked ? (
            <span className="text-[9px] font-black text-slate-500 bg-slate-800/40 border border-slate-700/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {/* Accordion Expandable Details View */}
      {!task.isLocked && isExpanded && (
        <div className="px-6 pb-8 pt-4 border-t border-white/5 bg-black/10 flex flex-col gap-6 animate-in slide-in-from-top-3 duration-250">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
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

            <div className="md:col-span-5 flex flex-col justify-between items-center gap-6 relative min-h-[160px] w-full">
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
                {task.id !== 3 && (
                  <button
                    onClick={() => onVerify(task)}
                    disabled={verifyingTaskId === task.id || dbTasks[`task${task.id}`]}
                    className="cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-[#10b981]/5 hover:bg-[#10b981]/10 border border-[#10b981]/40 hover:border-[#10b981] text-[#10b981] font-black text-[10px] tracking-widest uppercase rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {verifyingTaskId === task.id ? "Verifying..." : dbTasks[`task${task.id}`] ? "Verified" : "Verify Task"}
                  </button>
                )}

                <Link
                  href={task.actionUrl}
                  className="group cursor-pointer w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[10px] tracking-widest uppercase rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-center"
                >
                  <span>{task.actionLabel}</span>
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
}
