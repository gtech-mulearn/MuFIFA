"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";
import { TEAM_FLAGS, TEAM_WHATSAPP_LINKS } from "@/utils/constants";
import Header from "@/app/tasks/components/Header/Header";

const DOMAIN_STYLES = {
  Coder: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  Creative: "bg-pink-500/10 border-pink-500/30 text-pink-400",
  Strategist: "bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]",
  Maker: "bg-[#4F46E5]/10 border-[#4F46E5]/30 text-[#4F46E5]",
};

// SVG icon components for sidebar tabs
const TabIcons = {
  player: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  ),
  edit: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  password: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  badges: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
};

const SIDEBAR_TABS = [
  { id: "player", label: "Player" },
  { id: "edit", label: "Edit Details" },
  { id: "password", label: "Reset Password" },
  { id: "badges", label: "Badges" },
];

// Dummy badges data
const DUMMY_BADGES = [
  {
    id: 1,
    name: "First Goal",
    description: "Completed your first task",
    icon: "/playerCard/badge/IMG_2353.PNG",
    earned: false,
    date: null,
  },
  {
    id: 2,
    name: "Creative Spark",
    description: "Submitted a creative project",
    icon: "/playerCard/badge/IMG_2349.PNG",
    earned: false,
    date: null,
  },
  {
    id: 3,
    name: "Team Player",
    description: "Collaborated with 5+ members",
    icon: "/playerCard/badge/people.PNG",
    earned: false,
    date: null,
  },
  {
    id: 4,
    name: "Sprint Champion",
    description: "Won a design sprint",
    icon: "/playerCard/badge/IMG_2355.PNG",
    earned: false,
    date: null,
  },
  {
    id: 5,
    name: "Code Warrior",
    description: "Solved 10 coding challenges",
    icon: "/playerCard/badge/IMG_2351.PNG",
    earned: false,
    date: null,
  },
  {
    id: 6,
    name: "Content Creator",
    description: "Published 3 articles",
    icon: "/playerCard/badge/IMG_2357.PNG",
    earned: false,
    date: null,
  },
];

function ProfilePageContent({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const [player, setPlayer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const searchParams = useSearchParams();
  const activeTab =
    searchParams && searchParams.get("tab") === "badges" ? "badges" : "profile";

  // Edit details form state
  const [editForm, setEditForm] = useState({
    name: "",
    college: "",
    bio: "",
    phone: "",
    muid: "",
    socials: {
      website: "",
      reddit: "",
      discord: "",
      twitter: "",
      github: "",
      medium: "",
    },
  });
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState("");

  // Reset password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        setCurrentUser(null);
        router.push("/");
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function fetchProfileAndAuth() {
      try {
        const profileRes = await fetch(
          `/api/v1/profile/${encodeURIComponent(id)}`,
        );
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.success) {
          setError(profileData.error?.message || "Profile not found.");
          setLoading(false);
          return;
        }

        setPlayer(profileData.data);

        // Pre-fill edit form
        const socialsObj = profileData.data.socials || {};
        setEditForm({
          name: profileData.data.name || "",
          college:
            profileData.data.institution || profileData.data.college || "",
          bio: profileData.data.bio || "",
          phone: profileData.data.phone || "",
          muid: profileData.data.muid || "",
          socials: {
            website: socialsObj.website || "",
            reddit: socialsObj.reddit || "",
            discord: socialsObj.discord || "",
            twitter: socialsObj.twitter || "",
            github: socialsObj.github || "",
            medium: socialsObj.medium || "",
          },
        });

        const authRes = await fetch("/api/v1/auth/me");
        const authData = await authRes.json();
        if (authRes.ok && authData.success) {
          setCurrentUser(authData.data);
        }
      } catch (err) {
        console.error("Error fetching player profile/auth:", err);
        setError("Unable to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileAndAuth();
  }, [id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, WEBP, and GIF images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Image must be under 3MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || "Failed to upload avatar.");
        return;
      }

      setPlayer((prev) => ({ ...prev, avatar_url: data.avatar_url }));
    } catch (err) {
      console.error("Avatar upload error:", err);
      setUploadError("A connection error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaved(false);
    setEditError("");

    try {
      const res = await fetch(`/api/v1/profile/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          institution: editForm.college,
          bio: editForm.bio,
          phone: editForm.phone,
          muid: editForm.muid,
          socials: editForm.socials,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setEditError(resData.error || "Failed to update profile details.");
        return;
      }

      setPlayer(resData.data);
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setEditError("A connection error occurred. Please try again.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.error || "Failed to update password.");
        return;
      }

      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      console.error("Password reset error:", err);
      setPasswordError("A connection error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const isOwner = currentUser && player && currentUser.id === player.id;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Renders the content panel dynamically based on the active sidebar tab.

  const renderPlayerTab = () => (
    <div className="flex flex-col gap-6">
      {/* Player Info Header */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] p-[2.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden">
            {player.avatar_url ? (
              <Image
                src={player.avatar_url}
                alt={player.name || "Player Avatar"}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#131927] flex items-center justify-center font-extrabold text-lg text-slate-100 uppercase tracking-wider">
                {getInitials(player.name)}
              </div>
            )}
            {isOwner && (
              <label
                htmlFor="avatar-upload-input"
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] text-white font-bold rounded-full"
              >
                {uploading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span className="mt-0.5">Edit</span>
                )}
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {TEAM_FLAGS[player.team] && (
            <div
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#131927] bg-[#131927] shadow-md flex items-center justify-center overflow-hidden"
              style={{ transform: "translate(15%, 15%)" }}
            >
              <span
                className={`fi fi-${TEAM_FLAGS[player.team]} scale-125`}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h2 className="text-base font-extrabold tracking-wide text-slate-100">
            {player.name}
          </h2>
          <span className="text-xs font-bold text-[#06B6D4] tracking-wider">
            @{player.user_id}
          </span>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] py-1.5 px-3 rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
          <svg
            className="w-3 h-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {uploadError}
        </div>
      )}

      {/* Points Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0f1a2e]/80 border border-white/8 rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-[8px] font-black tracking-wider text-slate-500">
            μPoints
          </span>
          <span className="text-lg font-black text-[#06B6D4]">
            {player.mu_points || 0}
          </span>
        </div>
        <div className="bg-[#0f1a2e]/80 border border-white/8 rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
            Rank
          </span>
          <span className="text-lg font-black text-[#f0d060]">
            #{player.rank ?? 1}
          </span>
        </div>
        <div className="bg-[#0f1a2e]/80 border border-white/8 rounded-xl p-3 flex flex-col items-center gap-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
            Badges
          </span>
          <span className="text-lg font-black text-[#4F46E5]">
            {DUMMY_BADGES.filter((b) => b.earned).length}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 border-b border-white/5 pb-2">
          Player Details
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              Team
            </span>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              {TEAM_FLAGS[player.team] && (
                <span
                  className={`fi fi-${TEAM_FLAGS[player.team]}`}
                  aria-hidden="true"
                />
              )}
              {player.team}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              Domain
            </span>
            <span
              className={`inline-block w-fit border px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider leading-none ${DOMAIN_STYLES[player.domain] || "bg-white/5 border-white/10 text-white"}`}
            >
              {player.domain}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              College
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {player.institution || ""}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              μID
            </span>
            <span className="text-xs font-semibold text-[#06B6D4] font-bold">
              {player.muid || "Not Linked"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-600">
              Joined
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {new Date(player.created_at || Date.now()).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 border-b border-white/5 pb-2">
          Bio
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {player.bio || ""}
        </p>
      </div>

      {/* Social Links */}
      {player.socials && Object.values(player.socials).some((v) => v) && (
        <div className="flex flex-col gap-1.5 mt-2">
          <h3 className="text-[9px] font-black uppercase tracking-[3px] text-slate-500 border-b border-white/5 pb-2">
            Socials
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {player.socials.website && (
              <a
                href={
                  player.socials.website.startsWith("http")
                    ? player.socials.website
                    : `https://${player.socials.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-[#4F46E5]/10 border border-[#4F46E5]/20 hover:bg-[#4F46E5]/25 hover:border-[#4F46E5]/50 text-[10px] text-indigo-400 font-bold transition-all flex items-center gap-1.5"
              >
                <svg
                  className="w-3 h-3 fill-none stroke-current"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Website
              </a>
            )}
            {player.socials.github && (
              <a
                href={
                  player.socials.github.startsWith("http")
                    ? player.socials.github
                    : `https://github.com/${player.socials.github}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-slate-800/40 border border-slate-700 hover:bg-slate-700/60 text-[10px] text-slate-300 font-bold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}
            {player.socials.twitter && (
              <a
                href={
                  player.socials.twitter.startsWith("http")
                    ? player.socials.twitter
                    : `https://twitter.com/${player.socials.twitter}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 text-[10px] text-[#1DA1F2] font-bold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </a>
            )}
            {player.socials.reddit && (
              <a
                href={
                  player.socials.reddit.startsWith("http")
                    ? player.socials.reddit
                    : `https://reddit.com/user/${player.socials.reddit}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-[#FF4500]/10 border border-[#FF4500]/20 hover:bg-[#FF4500]/20 text-[10px] text-[#FF4500] font-bold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.32-4.16 4.31.92c.04.96.83 1.73 1.8 1.73 1 0 1.81-.81 1.81-1.81s-.81-1.81-1.81-1.81c-.74 0-1.38.44-1.66 1.07l-4.73-1c-.22-.05-.44.09-.5.31l-1.5 4.72c-2.51.05-4.79.7-6.47 1.72-.56-.75-1.46-1.22-2.41-1.22-1.65 0-3 1.35-3 3 0 1.1.6 2.06 1.49 2.58-.03.26-.05.52-.05.78 0 3.86 4.49 7 10 7s10-3.14 10-7c0-.26-.02-.52-.05-.78.89-.52 1.49-1.48 1.49-2.58zm-16 1.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 4c-1.82 1.82-5.18 1.82-7 0-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0 1.43 1.43 4.16 1.43 5.58 0 .2-.2.51-.2.71 0 .2.2.2.51 0 .71zm-.5-2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                </svg>
                Reddit
              </a>
            )}
            {player.socials.medium && (
              <a
                href={
                  player.socials.medium.startsWith("http")
                    ? player.socials.medium
                    : `https://medium.com/@${player.socials.medium}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-slate-200/5 border border-slate-700 hover:bg-slate-700/30 text-[10px] text-slate-300 font-bold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zm3.04 0c0 3.21-.4 5.82-.9 5.82s-.9-2.61-.9-5.82.4-5.82.9-5.82.9 2.61.9 5.82z" />
                </svg>
                Medium
              </a>
            )}
            {player.socials.discord && (
              <span className="px-2.5 py-1 rounded bg-[#5865F2]/10 border border-[#5865F2]/20 text-[10px] text-[#5865F2] font-bold transition-all flex items-center gap-1.5 select-text">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                </svg>
                Discord: {player.socials.discord}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderEditTab = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-slate-100 tracking-wide">
          Edit Details
        </h3>
        <p className="text-[10px] text-slate-500">
          Update your profile information
        </p>
      </div>

      <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
        {/* Avatar Upload Field */}
        <div className="flex flex-col gap-2.5 pb-3 border-b border-white/5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Profile Avatar
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] p-[2.5px] shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden shrink-0">
              {player.avatar_url ? (
                <Image
                  src={player.avatar_url}
                  alt={player.name || "Player Avatar"}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#131927] flex items-center justify-center font-extrabold text-lg text-slate-100 uppercase tracking-wider">
                  {getInitials(player.name)}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label
                htmlFor="avatar-upload-edit"
                className="w-fit px-3 py-1.5 rounded-lg bg-[#4F46E5]/10 border border-[#4F46E5]/30 hover:bg-[#4F46E5]/25 hover:border-[#4F46E5]/50 text-[10px] text-indigo-400 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                {player.avatar_url ? "Change Avatar" : "Upload Avatar"}
              </label>
              <input
                id="avatar-upload-edit"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
              <span className="text-[8px] text-slate-500 font-semibold leading-normal">
                Supports JPEG, PNG, WEBP, or GIF. Max 3MB. Saved instantly.
              </span>
            </div>
          </div>
          {uploadError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] py-1.5 px-3 rounded-lg font-semibold flex items-center gap-1.5 mt-1">
              <svg
                className="w-3.5 h-3.5 text-red-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {uploadError}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Full Name
          </label>
          <input
            type="text"
            value={editForm.name}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Enter your name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            College
          </label>
          <input
            type="text"
            value={editForm.college}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, college: e.target.value }))
            }
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Enter your college"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            μID (µLearn ID)
          </label>
          <input
            type="text"
            value={editForm.muid}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, muid: e.target.value }))
            }
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="e.g. username@mulearn"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Phone
          </label>
          <input
            type="tel"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Enter phone number"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Bio
          </label>
          <textarea
            value={editForm.bio}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, bio: e.target.value }))
            }
            rows={3}
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors resize-none placeholder:text-slate-600"
            placeholder="Tell us about yourself"
          />
        </div>

        <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Social Media Links
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Personal Website
              </label>
              <input
                type="text"
                value={editForm.socials?.website || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, website: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="website.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Twitter
              </label>
              <input
                type="text"
                value={editForm.socials?.twitter || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, twitter: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="Twitter username"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                GitHub
              </label>
              <input
                type="text"
                value={editForm.socials?.github || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, github: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="GitHub username"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Reddit
              </label>
              <input
                type="text"
                value={editForm.socials?.reddit || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, reddit: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="Reddit username"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Medium
              </label>
              <input
                type="text"
                value={editForm.socials?.medium || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, medium: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="Medium username"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                Discord
              </label>
              <input
                type="text"
                value={editForm.socials?.discord || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, discord: e.target.value },
                  }))
                }
                className="w-full bg-[#0f1a2e] border border-white/10 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
                placeholder="Discord username"
              />
            </div>
          </div>
        </div>

        {editError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] py-2 px-3 rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-red-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {editError}
          </div>
        )}

        {editSaved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] py-2 px-3 rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Profile updated successfully!
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
        >
          Save Changes
        </button>
      </form>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-slate-100 tracking-wide">
          Reset Password
        </h3>
        <p className="text-[10px] text-slate-500">
          Change your account password
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
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
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Enter current password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
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
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Enter new password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">
            Confirm Password
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
            className="w-full bg-[#0f1a2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#4F46E5]/50 transition-colors placeholder:text-slate-600"
            placeholder="Confirm new password"
          />
        </div>

        {passwordError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] py-2 px-3 rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-red-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] py-2 px-3 rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Password changed successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50"
        >
          {passwordLoading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );

  const renderBadgesTab = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-slate-100 tracking-wide">
          Badges
        </h3>
        <p className="text-[10px] text-slate-500">
          {DUMMY_BADGES.filter((b) => b.earned).length} of {DUMMY_BADGES.length}{" "}
          badges earned
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] transition-all duration-700"
            style={{
              width: `${(DUMMY_BADGES.filter((b) => b.earned).length / DUMMY_BADGES.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-[9px] text-slate-600 font-semibold text-right">
          {Math.round(
            (DUMMY_BADGES.filter((b) => b.earned).length /
              DUMMY_BADGES.length) *
              100,
          )}
          % Complete (Locked)
        </span>
      </div>

      {/* Badge Grid */}
      <div className="flex flex-col gap-2.5">
        {DUMMY_BADGES.map((badge) => (
          <div
            key={badge.id}
            className={`flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-[#0f1a2e]/80 hover:border-[#4F46E5]/30 transition-all ${!badge.earned ? "opacity-50 grayscale" : ""}`}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-[#4F46E5]/10 border border-[#4F46E5]/20">
              <div className="relative w-6 h-6">
                <Image
                  src={badge.icon}
                  alt={badge.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-200 truncate">
                  {badge.name}
                </span>
                {badge.earned ? (
                  <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5V9.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5z"
                      />
                    </svg>
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <svg
                      className="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5z"
                      />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-500 truncate">
                {badge.description}
              </span>
              <span className="text-[8px] text-slate-600 mt-0.5">
                {badge.date || "Locked"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "player":
        return renderPlayerTab();
      case "edit":
        return renderEditTab();
      case "password":
        return renderPasswordTab();
      case "badges":
        return renderBadgesTab();
      default:
        return renderPlayerTab();
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-6 md:gap-8 pb-10">
      {/* Full-page stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-[0.28] pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#030207]/60 via-[#030207]/40 to-[#030207]/80 pointer-events-none" />

      {/* Ambient radial glows */}
      <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none rounded-full" />
      <div className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06)_0%,_transparent_60%)] pointer-events-none rounded-full" />

      {/* TOP N ARENA BANNER (with stadium background) */}
      <div className="relative rounded-3xl overflow-hidden border border-white/5 p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-2xl bg-[#090715]/40 backdrop-blur-md z-10">
        {/* Stadium background overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.30] pointer-events-none"
          style={{ backgroundImage: `url('/bg_img.webp')` }}
        />
        {/* Dark gradient overlay to fade at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090715]/50 to-[#030207] z-0 pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10">
          <Header
            title="PLAYER"
            highlightedTitle="SCORECARD"
            subtitle="View player stats, verify social integrations and manage profile settings."
          />
        </div>
      </div>

      {/* Main Content — 3-Column Layout */}
      <div className="relative z-10 flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8">
        {error || !player ? (
          /* ERROR / NOT FOUND */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md bg-glass-card rounded-2xl p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 text-center bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79,70,229,0.015))]">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-200">
                  Profile Not Found
                </h2>
                <p className="text-xs text-slate-400">
                  {error ||
                    "The requested player profile could not be found. Make sure the ID or Player ID is correct."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                  href="/leaderboard"
                  className="flex-1 text-center py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-xs font-bold uppercase tracking-wider transition-colors bg-white/5"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* LAYOUT */
          <div className="flex flex-col gap-6">
            {/* WhatsApp CTA — top center */}
            {isOwner && (
              <div className="flex justify-center w-full">
                <a
                  href={
                    TEAM_WHATSAPP_LINKS[player.team] ||
                    "https://chat.whatsapp.com/"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer bg-[#25D366] text-white hover:bg-[#20ba5a] w-full sm:w-1/2 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-0.5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    className="w-4 h-4 fill-current"
                  >
                    <path d="M16.004 3C8.82 3 3 8.82 3 16.004c0 2.293.598 4.532 1.734 6.504L3 29l6.676-1.706a12.95 12.95 0 0 0 6.328 1.636C23.18 28.93 29 23.11 29 15.926 29 8.82 23.18 3 16.004 3zm0 23.798a10.74 10.74 0 0 1-5.47-1.496l-.392-.232-3.96 1.01 1.056-3.86-.254-.4a10.72 10.72 0 0 1-1.646-5.816c0-5.94 4.83-10.77 10.766-10.77 2.878 0 5.584 1.12 7.617 3.154a10.69 10.69 0 0 1 3.148 7.612c0 5.94-4.83 10.798-10.766 10.798zm5.906-8.052c-.322-.16-1.904-.94-2.198-1.046-.294-.106-.508-.16-.722.16-.214.32-.83 1.046-1.018 1.26-.186.214-.374.24-.694.08-.32-.16-1.35-.498-2.572-1.586-.95-.846-1.59-1.89-1.776-2.21-.188-.32-.02-.492.14-.65.144-.144.32-.374.48-.56.16-.188.214-.32.32-.534.106-.214.054-.4-.026-.56-.08-.16-.722-1.74-.99-2.386-.26-.626-.524-.54-.722-.55l-.614-.01c-.214 0-.56.08-.854.4-.294.32-1.122 1.096-1.122 2.674 0 1.578 1.15 3.102 1.31 3.316.16.214 2.262 3.454 5.48 4.842.766.33 1.364.526 1.83.674.77.244 1.47.21 2.024.128.618-.092 1.904-.778 2.172-1.53.268-.752.268-1.396.188-1.53-.08-.132-.294-.212-.616-.372z" />
                  </svg>
                  Join {player.team} WhatsApp Group
                </a>
              </div>
            )}
            <hr className="border-white/5 my-1" />
            {/* Conditional Layout based on Ownership */}
            {isOwner ? (
              <div className="flex flex-col xl:flex-row gap-6 items-start">
                {/* COLUMN 2: Forms / Badges Content Panel */}
                <div className="w-full xl:w-[480px] 2xl:w-[520px] shrink-0 xl:sticky xl:top-6 flex flex-col gap-6">
                  {activeTab === "badges" ? (
                    <div className="bg-[#131927]/80 border border-white/8 rounded-2xl p-5 backdrop-blur-md shadow-lg min-h-[400px]">
                      {renderBadgesTab()}
                    </div>
                  ) : (
                    <>
                      {/* Edit Details Card */}
                      <div className="bg-[#131927]/80 border border-white/8 rounded-2xl p-5 backdrop-blur-md shadow-lg">
                        {renderEditTab()}
                      </div>

                      {/* Reset Password Card */}
                      <div className="bg-[#131927]/80 border border-white/8 rounded-2xl p-5 backdrop-blur-md shadow-lg">
                        {renderPasswordTab()}
                      </div>
                    </>
                  )}
                </div>

                {/* COLUMN 3: Player Card & Share Sidebar */}
                <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 xl:sticky xl:top-6 xl:min-w-[600px] w-full">
                  <PlayerCard player={player} />
                  <ProfileShare player={player} />
                </div>
              </div>
            ) : (
              /* GUEST / NOT OWNER: Show ONLY Player Card & Share option centered */
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-3xl mx-auto py-10">
                <PlayerCard player={player} />
                <ProfileShare player={player} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProfilePageContent params={params} />
    </Suspense>
  );
}

function ProfileShare({ player }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out my µFIFA World Cup 2026 Player Card for ${player?.name || "Player"}!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const cardElement = document.querySelector(".player-card");
      if (!cardElement) {
        setDownloading(false);
        return;
      }

      const canvas = await html2canvas(cardElement, {
        scale: 2, // high quality
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${player?.user_id || "player"}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download player card:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-row lg:flex-col items-center bg-[#FAF8F5] text-[#5C4A37] rounded-full py-3 px-5 lg:py-6 lg:px-3.5 shadow-xl gap-5 lg:gap-5 border border-[#EBE8E2] select-none shrink-0 w-fit lg:w-[54px]">
      <span className="text-[9px] font-black tracking-widest uppercase opacity-75 lg:-rotate-90 lg:my-2">
        Share
      </span>

      {/* Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform text-[#5C4A37] hover:text-[#1DA1F2]"
        title="Share on Twitter"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.986 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform text-[#5C4A37] hover:text-[#0A66C2]"
        title="Share on LinkedIn"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
        </svg>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="hover:scale-110 transition-transform text-[#5C4A37] hover:text-[#4F46E5] cursor-pointer focus:outline-none"
        title="Copy Profile Link"
      >
        {copied ? (
          <svg
            className="w-5 h-5 text-emerald-600 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        )}
      </button>

      {/* Download Card */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="hover:scale-110 transition-transform text-[#5C4A37] hover:text-[#4F46E5] cursor-pointer focus:outline-none disabled:opacity-50"
        title="Download Player Card"
      >
        {downloading ? (
          <svg
            className="w-5 h-5 animate-spin text-[#4F46E5]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        )}
      </button>

      {/* Divider */}
      <div className="w-6 lg:w-8 h-[1px] bg-[#EBE8E2] my-0.5 lg:my-0" />

      {/* Comment/Feedback */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform text-[#5C4A37] hover:text-[#25D366]"
        title="Send via WhatsApp"
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </a>
    </div>
  );
}
