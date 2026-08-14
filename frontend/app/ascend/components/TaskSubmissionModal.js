import React, { useState } from "react";
import { isPastDeadline as checkPastDeadline } from "@/utils/ascendDeadline";

export default function TaskSubmissionModal({ selectedTask, onClose, onSuccess }) {
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const isPastDeadline = checkPastDeadline(new Date(), selectedTask?.deadline);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (isPastDeadline) {
      setSubmitError("Your task wasn't uploaded as it's submitted after the deadline");
      return;
    }

    setSubmittingTask(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const res = await fetch("/api/v1/ascend/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: selectedTask.id,
          submission_url: submissionUrl,
          notes: submissionNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess("Solution submitted successfully!");
        setSubmissionUrl("");
        setSubmissionNotes("");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitError(data.error || "Your task wasn't uploaded as it's submitted after the deadline");
      }
    } catch (err) {
      setSubmitError("Network error submitting solution.");
    } finally {
      setSubmittingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 selection:bg-white selection:text-black">
      <div className="bg-[#0c0c12] rounded-3xl border border-white/15 p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(255,255,255,0.08)] relative animate-fadeIn my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close Modal"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/15 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            SOLUTION SUBMISSION
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">Submit Deliverable</h2>
        </div>

        {/* Task Preview Header Card */}
        <div className="p-4 rounded-2xl bg-[#050508] border border-white/10 flex items-start gap-3 mb-6">
          {selectedTask?.company_logo ? (
            <img
              src={selectedTask.company_logo}
              alt={selectedTask.company_name}
              className="w-10 h-10 object-contain shrink-0 mt-0.5"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white font-black text-xs flex items-center justify-center shrink-0">
              {(selectedTask?.company_name || "Co").substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              {selectedTask?.company_name}
            </span>
            <h4 className="text-sm font-black text-white tracking-tight truncate">
              {selectedTask?.title}
            </h4>
            {selectedTask?.requirements && (
              <span className="text-[11px] font-mono text-slate-400 truncate mt-1">
                Stack: {selectedTask.requirements}
              </span>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {submitError && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
                Deliverable Link *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                GitHub README / Google Doc
              </span>
            </div>
            <input
              type="url"
              required
              placeholder="https://github.com/user/repo#readme or https://docs.google.com/document/d/..."
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              className="w-full bg-[#050508] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all font-mono"
            />
            
            {/* Accepted Submission Formats Helper Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-400">Accepted Formats:</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                GitHub README
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                Google Doc
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                Live URL / Figma
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2">
              Submission Notes & Architecture (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Provide key features, deployment URL, setup instructions, or notes for evaluators..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full bg-[#050508] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTask}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            >
              <span>{submittingTask ? "Submitting..." : "Submit Deliverable"}</span>
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
