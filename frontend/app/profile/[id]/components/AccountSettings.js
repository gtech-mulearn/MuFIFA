import React from "react";
import Link from "next/link";

export default function AccountSettings({
  isOwner,
  openModalWithTab,
  setShowDeleteModal,
  handleLogout,
}) {
  return (
    <div className="relative z-10 flex flex-col gap-6 mt-2">
      {/* Recent Activity Full-Width Redirect Card */}
      {isOwner && (
        <Link
          href="/points-history"
          className="relative overflow-hidden rounded-none sm:rounded-3xl border border-white/8 bg-[#090715]/40 backdrop-blur-md p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl hover:border-violet-500/30 transition-all hover:scale-[1.01] duration-300 group cursor-pointer"
        >
          <div className="absolute top-[10%] left-[2%] w-[120px] h-[120px] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.05)_0%,_transparent_60%)] pointer-events-none rounded-full" />
          <div className="flex items-center gap-4.5 text-left relative z-10">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 group-hover:scale-115 transition-transform duration-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <svg
                className="w-6 h-6"
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
            <div className="flex flex-col">
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Recent Activity & Points History
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                View your complete points ledger, completed challenges, and
                prediction history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-violet-400 uppercase tracking-widest group-hover:text-white transition-colors relative z-10 shrink-0">
            <span>View Full History</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1.5 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </Link>
      )}

      {/* Account Settings Panel */}
      <div className="bg-[#090715]/40 border border-white/8 backdrop-blur-md rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 border-b border-white/5 pb-2.5">
            Account Settings
          </h3>
          {isOwner ? (
            <div className="flex flex-col gap-4">
              {/* 2-Column Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Profile info trigger */}
                <button
                  onClick={() => openModalWithTab("profile")}
                  className="cursor-pointer w-full flex items-center justify-between p-4 rounded-2xl bg-[#0b0c16]/50 border border-white/5 hover:border-violet-500/20 hover:bg-[#100e23]/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0 text-slate-400">
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
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 01-7.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-200">
                        Profile Information
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                        Update your personal details
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>

                {/* Password reset trigger */}
                <button
                  onClick={() => openModalWithTab("password")}
                  className="cursor-pointer w-full flex items-center justify-between p-4 rounded-2xl bg-[#0b0c16]/50 border border-white/5 hover:border-violet-500/20 hover:bg-[#100e23]/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0 text-slate-400">
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
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-200">
                        Security
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                        Change password and settings
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>

              {/* Action Buttons aligned bottom-right */}
              <div className="flex flex-wrap items-center justify-end gap-3 mt-4 border-t border-white/5 pt-4">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="cursor-pointer px-6 py-2.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg group"
                >
                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.34 9m-4.78 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </div>
                  <span>Delete Account</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="cursor-pointer px-6 py-2.5 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 border border-[#ef4444]/20 hover:border-[#ef4444]/40 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                      />
                    </svg>
                  </div>
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs font-semibold">
              You must be logged in as the owner to view or edit account settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
