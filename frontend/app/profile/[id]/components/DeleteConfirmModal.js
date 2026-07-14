import React from "react";

export default function DeleteConfirmModal({
  showDeleteModal,
  setShowDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  isDeleting,
  deleteError,
  setDeleteError,
  handleDeleteAccount,
  player,
}) {
  if (!showDeleteModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fade-in animate-duration-200">
      <div className="relative w-full max-w-md bg-[#0d070b]/95 border border-red-500/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-scale-up animate-duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-red-500/10 pb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-red-500"
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
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-wider">
              Delete Account
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              This action is irreversible
            </span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-xs font-semibold text-slate-300 leading-relaxed flex flex-col gap-2">
          <p>Deleting your account will permanently remove:</p>
          <ul className="list-disc pl-4 flex flex-col gap-1 text-slate-400 text-[11px]">
            <li>Your profile information from the innovations database</li>
            <li>All your match predictions and prediction score history</li>
            <li>All your completed task history and levels</li>
          </ul>
          <p className="text-red-400/95 font-bold mt-1 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
            ⚠️ Your squad team points ({player?.mu_points || 0} µPoints)
            will be deducted from your squad's total score.
          </p>
          <p className="mt-2 text-slate-400">
            To confirm, please type{" "}
            <span className="font-extrabold text-red-400">DELETE</span> below:
          </p>
        </div>

        {/* Input field */}
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => {
              setDeleteConfirmText(e.target.value);
              if (deleteError) setDeleteError("");
            }}
            disabled={isDeleting}
            className="w-full px-4 py-3 bg-red-950/10 border border-red-500/20 focus:border-red-500/50 rounded-xl text-xs font-extrabold text-red-400 placeholder:text-slate-600 focus:outline-none transition-all"
          />
          {deleteError && (
            <span className="text-[10px] text-red-400 font-extrabold">
              {deleteError}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-1">
          <button
            type="button"
            onClick={() => {
              if (isDeleting) return;
              setShowDeleteModal(false);
              setDeleteConfirmText("");
              setDeleteError("");
            }}
            disabled={isDeleting}
            className="cursor-pointer px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting || deleteConfirmText !== "DELETE"}
            className="cursor-pointer px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg disabled:opacity-30 flex items-center justify-center gap-1.5"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
