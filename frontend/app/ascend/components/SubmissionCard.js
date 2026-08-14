import React from "react";
import { isPastDeadline } from "@/utils/ascendDeadline";

export default function SubmissionCard({ submission }) {
  const company = submission.ascend_tasks?.company_name || "Company Partner";
  const title = submission.ascend_tasks?.title || `Task #${submission.task_id}`;
  const totalRating = submission.total_rating || 0;

  const statusColors = {
    Pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    Evaluated: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    Accepted: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  };

  const statusClass =
    statusColors[submission.status] ||
    "bg-white/10 text-slate-300 border-white/20";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090815]/90 hover:border-violet-500/30 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all duration-300 backdrop-blur-xl relative overflow-hidden shadow-lg group">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-white text-sm tracking-wide">
            {company}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusClass}`}
          >
            {submission.status}
          </span>
        </div>

        <h3 className="font-black text-white text-base leading-snug">{title}</h3>

        {submission.submission_url && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-extrabold uppercase text-[10px]">
              Deliverable:
            </span>
            <a
              href={submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 hover:text-white font-mono underline truncate max-w-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{submission.submission_url}</span>
              <svg
                className="w-3 h-3 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}

        {submission.submitted_at && (() => {
          const isLateSub = isPastDeadline(submission.submitted_at, submission.ascend_tasks?.deadline);
          const formattedDate = new Date(submission.submitted_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">
                Submitted:
              </span>
              <span className={`font-mono text-[11px] ${isLateSub ? "text-rose-400 font-bold" : "text-slate-300"}`}>
                {formattedDate}
              </span>
              {isLateSub && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold uppercase tracking-wider">
                  Submitted Late
                </span>
              )}
            </div>
          );
        })()}

        {submission.notes && (
          <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="text-slate-400 font-black text-[10px] uppercase tracking-wider block">
              Candidate Notes & Documentation:
            </span>
            <span className="leading-relaxed text-slate-300 font-normal">
              {submission.notes}
            </span>
          </div>
        )}

        {submission.admin_feedback && (
          <div className="text-xs text-slate-300 bg-violet-500/10 p-3 rounded-xl border border-violet-500/20 space-y-1">
            <span className="text-violet-300 font-black text-[10px] uppercase tracking-wider block">
              Reviewer Feedback:
            </span>
            <span className="leading-relaxed text-slate-200">
              {submission.admin_feedback}
            </span>
          </div>
        )}
      </div>

      <div className="w-full md:w-auto flex flex-col items-center justify-center p-4 bg-black/70 border border-white/15 rounded-2xl text-center shrink-0 min-w-[200px]">
        {submission.status === "Pending" ? (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 animate-pulse">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-xs text-white font-extrabold tracking-wider uppercase">
              Under Evaluation
            </div>
            <span className="text-[10px] text-slate-400">
              Reviewers inspecting solution
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-violet-500/20 border border-violet-500/30 text-violet-300">
              {totalRating >= 8
                ? "Elite Candidate"
                : totalRating >= 6
                ? "Strong Candidate"
                : "Verified Solution"}
            </span>
            <div className="text-2xl font-black text-white my-1 flex items-center gap-1">
              <svg
                className="w-5 h-5 text-amber-400 fill-amber-400"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{totalRating}</span>
              <span className="text-xs font-bold text-slate-400">/ 10</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium flex gap-2">
              <span>
                Quality: <strong className="text-white">{submission.quality_score}/5</strong>
              </span>
              <span>•</span>
              <span>
                Innovation:{" "}
                <strong className="text-white">{submission.innovation_score}/5</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
