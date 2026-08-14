import React from "react";
import { getDeadlineCutoff } from "@/utils/ascendDeadline";

export default function TaskCard({ task, submitted, onSelectTask }) {
  const initials = (task.company_name || "Co")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
        submitted
          ? "border border-emerald-500/40 bg-[#061510]/90 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          : "border border-white/10 bg-[#0b0a12]/90 hover:border-white/20 hover:shadow-[0_0_35px_rgba(124,58,237,0.12)]"
      }`}
    >
      <div>
        {/* Header with Partner logo/avatar & verified check */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              {task.company_logo ? (
                <img
                  src={task.company_logo}
                  alt={task.company_name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full rounded-lg bg-white/10 text-white font-black text-sm items-center justify-center ${
                  task.company_logo ? "hidden" : "flex"
                }`}
              >
                {initials}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h4 className="font-extrabold text-white text-base tracking-tight leading-snug">
                {task.company_name}
              </h4>
            </div>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-lg font-black text-white leading-snug tracking-tight mb-2">
          {task.title}
        </h3>

        {/* Task Description */}
        <p className="text-xs text-slate-300 leading-relaxed font-normal mb-4 line-clamp-3">
          {task.description}
        </p>

        {/* Tech Stack Badge Row */}
        {task.requirements && (
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              STACK:
            </span>
            {task.requirements.split(",").map((req, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono"
              >
                {req.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Deadline & SUBMIT SOLUTION CTA */}
      <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            Deadline: {getDeadlineCutoff(task.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {submitted ? (
          <span className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Submitted</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelectTask(task)}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-95"
          >
            <span>SUBMIT SOLUTION</span>
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
