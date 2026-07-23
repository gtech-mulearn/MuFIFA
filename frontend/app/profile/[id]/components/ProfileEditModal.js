import React from "react";

export default function ProfileEditModal({
  isEditOpen,
  setIsEditOpen,
  activeTab,
  setActiveTab,
  editForm,
  setEditForm,
  editSaved,
  editError,
  handleEditSubmit,
  claimedFrames,
  player,
  uploading,
  uploadError,
  handleAvatarChange,
  passwordForm,
  setPasswordForm,
  passwordError,
  passwordSuccess,
  passwordLoading,
  handlePasswordSubmit,
}) {
  if (!isEditOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0d16]/95 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col gap-5 scrollbar-thin animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="text-sm font-extrabold tracking-widest text-white uppercase">
            Manage Profile settings
          </h3>
          <button
            onClick={() => setIsEditOpen(false)}
            className="cursor-pointer p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
            title="Close Modal"
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
        </div>

        {/* Premium Tab Selector */}
        <div className="flex border-b border-white/5 pb-2 gap-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          <button
            onClick={() => {
              setActiveTab("profile");
            }}
            className={`pb-1.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "profile"
              ? "border-violet-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => {
              setActiveTab("password");
            }}
            className={`pb-1.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer shrink-0 ${activeTab === "password"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            Security
          </button>
        </div>

        {/* TAB CONTENT: PROFILE INFO */}
        {activeTab === "profile" && (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Profile Avatar
              </label>
              <div className="flex items-center gap-4">
                {player?.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt="Avatar preview"
                    className="w-12 h-12 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {player?.name?.substring(0, 2) || "FC"}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="modal-avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                  >
                    {uploading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span>Choose Image</span>
                      </>
                    )}
                  </label>
                  <input
                    id="modal-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                    disabled={uploading}
                  />
                  <span className="text-[9px] text-slate-400">Max size 5MB (JPG, PNG, WEBP, GIF)</span>
                </div>
              </div>
              {uploadError && (
                <div className="text-[10px] font-bold text-rose-400 mt-1">
                  {uploadError}
                </div>
              )}
            </div>

            <h4 className="text-[10px] font-black uppercase text-violet-400 tracking-wider">
              Edit Personal Info
            </h4>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs py-2 px-3 rounded-xl font-bold">
                {editError}
              </div>
            )}

            {editSaved && (
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs py-2 px-3 rounded-xl font-bold">
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="e.g. +919876543210"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] font-black text-slate-500 tracking-wider">
                    µID (µLearn ID)
                  </label>
                  <div className="relative group cursor-help">
                    <span className="w-3.5 h-3.5 rounded-full bg-white/5 border border-white/10 text-slate-400 group-hover:text-white flex items-center justify-center text-[9px] font-bold transition-all">
                      ?
                    </span>
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-950 border border-white/10 rounded-lg p-2.5 shadow-2xl text-[10px] text-slate-300 font-medium leading-relaxed opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all origin-bottom-left z-50">
                      Get your ID by registering at{" "}
                      <a
                        href="https://mulearn.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:underline font-bold"
                      >
                        mulearn.org
                      </a>
                      .
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={editForm.muid}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      muid: e.target.value,
                    }))
                  }
                  disabled={!!player?.muid && player.muid.trim() !== ""}
                  placeholder="username@mulearn"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {player?.muid && player.muid.trim() !== "" ? (
                  <span className="text-[9px] text-amber-400/80 font-bold mt-0.5 flex items-center gap-1 select-none">
                    <span>🔒</span> Already set. If incorrect, contact an Admin.
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 select-none">
                    <span>⚠️</span> Once saved, this can only be edited by an Admin.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Institution / Organization
                </label>
                <input
                  type="text"
                  value={editForm.institutions}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      institutions: e.target.value,
                    }))
                  }
                  placeholder="Your college or organizations name"
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]/50 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Biography / Specialization
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  placeholder="Tell us about yourself..."
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#8B5CF6]/50 transition-colors resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all mt-2 shadow-lg"
            >
              Save Details
            </button>
          </form>
        )}

        {/* TAB CONTENT: SECURITY */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase text-[#10B981] tracking-wider">
              Change Password
            </h4>

            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs py-2 px-3 rounded-xl font-bold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-xs py-2 px-3 rounded-xl font-bold">
                Password updated successfully!
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/30 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/30 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="cursor-pointer w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all mt-2 shadow-lg disabled:opacity-55"
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
