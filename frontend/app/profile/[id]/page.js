"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import PlayerCard from "@/components/PlayerCard";
import { TEAM_FLAGS, TEAM_FLAG_BGS, calculateLevel } from "@/utils/constants";
import { usePlayer } from "@/components/PlayerContext";

function ProfilePageContent({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const { player: currentUser, refreshPlayer } = usePlayer();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // State variables containing details for profile updating.
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    phone: "",
    muid: "",
    institutions: "",
  });
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState("");

  // State variables containing values for password resetting.
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // State controlling detail edition modal visibility.
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // State variables for controlling safe account deletion.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Mock preferences state
  const [prefReminders, setPrefReminders] = useState(true);

  const isOwner = currentUser && player && currentUser.id === player.id;

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("player");
        }
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout request error:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(
        `/api/v1/profile/${encodeURIComponent(player.id)}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteError(
          data.error || "Failed to delete account. Please try again.",
        );
        setIsDeleting(false);
        return;
      }

      // Success: completely wipe client storage and cookies
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteError("A network error occurred. Please try again.");
      setIsDeleting(false);
    }
  };

  const fetchProfile = async () => {
    if (!id) return;
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
      setEditForm({
        name: profileData.data.name || "",
        bio: profileData.data.bio || "",
        phone: profileData.data.phone || "",
        muid: profileData.data.muid || "",
        institutions: profileData.data.institutions || "",
      });
    } catch (err) {
      console.error("Error fetching player profile:", err);
      setError("Unable to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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
      if (isOwner && refreshPlayer) {
        refreshPlayer();
      }
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
          bio: editForm.bio,
          phone: editForm.phone,
          muid: editForm.muid,
          institutions: editForm.institutions,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setEditError(resData.error || "Failed to update profile details.");
        return;
      }

      setPlayer(resData.data);
      setEditSaved(true);
      if (refreshPlayer) {
        refreshPlayer();
      }
      setTimeout(() => {
        setEditSaved(false);
        setIsEditOpen(false);
      }, 1500);
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
      setTimeout(() => {
        setPasswordSuccess(false);
        setIsEditOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Password reset error:", err);
      setPasswordError("A connection error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Profile Card Download function
  const [downloadingCard, setDownloadingCard] = useState(false);
  const handleDownloadCard = async () => {
    if (downloadingCard) return;
    setDownloadingCard(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const cardElement = document.querySelector(".player-card");
      if (!cardElement) {
        setDownloadingCard(false);
        return;
      }

      const canvas = await html2canvas(cardElement, {
        scale: 2,
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
      setDownloadingCard(false);
    }
  };

  // Profile Share Url
  const [copiedShare, setCopiedShare] = useState(false);
  const handleShareProfile = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070b19]">
        <div className="w-full max-w-md bg-glass-card border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 text-center">
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
              {error || "The requested player profile could not be found."}
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-xs font-bold uppercase tracking-wider transition-colors bg-white/5 text-center text-slate-200"
          >
            Go to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats
  const xp = player.xp_breakdown || {};
  const refXp =
    player.avg_highest_xp && player.avg_highest_xp > 0
      ? player.avg_highest_xp
      : 38;
  const stats = {
    creativity: Math.min(99, Math.round(((xp.creativity || 0) / refXp) * 99)),
    branding: Math.min(99, Math.round(((xp.branding || 0) / refXp) * 99)),
    innovation: Math.min(99, Math.round(((xp.innovation || 0) / refXp) * 99)),
    teamwork: Math.min(99, Math.round(((xp.teamwork || 0) / refXp) * 99)),
    execution: Math.min(99, Math.round(((xp.execution || 0) / refXp) * 99)),
  };
  const ovr = Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 5);

  const totalXp =
    (xp.creativity || 0) +
    (xp.branding || 0) +
    (xp.innovation || 0) +
    (xp.teamwork || 0) +
    (xp.execution || 0);

  const levelData = calculateLevel(totalXp);
  const level = levelData.level;
  const xpInLevel = levelData.currentLevelXp;
  const nextXp = levelData.nextXp;
  const xpPercent = levelData.xpPercent;

  // Nation standing data
  const nationRank = player.rank ? Math.max(1, (player.rank % 6) + 1) : 4;
  const nationContribution = Math.min(95, 30 + (player.mu_points % 60));
  const nationPercentage = Math.max(
    1,
    Math.min(99, 25 - Math.floor(player.mu_points / 20)),
  );

  const bannerBg =
    player.team && TEAM_FLAG_BGS[player.team]
      ? TEAM_FLAG_BGS[player.team]
      : "/bg_img.webp";

  // Referral count
  let referralCount = 0;
  if (player.tasks) {
    if (typeof player.tasks === "object") {
      referralCount = player.tasks.referal || 0;
    } else if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        referralCount = parsed.referal || 0;
      } catch (e) {}
    }
  }

  const performanceList = [
    {
      label: "Goals",
      value: Math.floor(player.mu_points / 7),
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      label: "Assists",
      value: referralCount,
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 16v-6a8 8 0 1 1 16 0v6M2 16h20M6 21h12" />
        </svg>
      ),
    },
    {
      label: "Predictions",
      value: player.predictions_count || 0,
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
    {
      label: "Challenges Won",
      value: player.completed_tasks_count || 0,
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5c0 2.2 1.8 4 4 4s4-1.8 4-4V6a4 4 0 0 0-4-4z" />
        </svg>
      ),
    },
    {
      label: "Top 3 Finishes",
      value: Math.floor((player.predictions_count || 0) / 3),
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Win Rate",
      value: `${Math.min(95, Math.max(20, 50 + ((player.predictions_count || 0) % 35)))}%`,
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
      ),
    },
  ];

  const achievementsList = [
    {
      id: "ref",
      name: "Referral Master",
      desc: "Earned on 12 May 2026",
      earned: referralCount > 0,
      icon: "/playerCard/badge/Object-2.webp",
    },
    {
      id: "pred",
      name: "Prediction Pro",
      desc: "Earned on 10 May 2026",
      earned: (player.predictions_count || 0) > 0,
      icon: "/playerCard/badge/Object-1.webp",
    },
    {
      id: "streak",
      name: "7 Day Streak",
      desc: "Earned on 8 May 2026",
      earned: player.mu_points >= 10,
      icon: "/playerCard/badge/Object.webp",
    },
    {
      id: "goal",
      name: "First Goal",
      desc: "Earned on 5 May 2026",
      earned: (player.completed_tasks_count || 0) > 0,
      icon: "/playerCard/badge/Object-6.webp",
    },
    {
      id: "nation",
      name: "Nation Builder",
      desc: "Earned on 1 May 2026",
      earned: !!player.team,
      icon: "/playerCard/badge/Object-3.webp",
    },
    {
      id: "champ",
      name: "World Champion",
      desc: "Locked",
      earned: player.rank === 1,
      icon: "/playerCard/badge/Object-5.webp",
    },
    {
      id: "top10",
      name: "Top 10 Predictor",
      desc: "Locked",
      earned: player.rank <= 10,
      icon: "/playerCard/badge/Object-4.webp",
    },
  ];

  function getTeamName(teamName) {
    return teamName || "Free Agent";
  }

  const countryCode = TEAM_FLAGS[player.team] || "un";

  const openModalWithTab = (tab) => {
    setActiveTab(tab);
    setIsEditOpen(true);
  };

  return (
    <div className="w-full relative flex flex-col gap-6 pt-20 sm:pt-24 pb-12 select-none">
      {/* Stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#04050a]/80 via-[#04050a]/60 to-[#04050a]/90 pointer-events-none" />

      {/* Top Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-6 md:px-8 mt-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
            PLAYER <span className="text-[#8B5CF6]">PROFILE</span>
          </h1>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-400">
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-600 px-1">&gt;</span>
            <span className="text-slate-300">Profile</span>
          </div>
        </div>

        <button
          onClick={handleShareProfile}
          className="cursor-pointer px-4 py-2 bg-white/5 border border-white/10 hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/10 rounded-xl text-xs font-semibold tracking-wide text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-lg"
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
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.343-2.73m-5.343 2.73l5.34 2.73m0 0a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185zm-.007-12.75a2.25 2.25 0 103.933-2.184 2.25 2.25 0 00-3.933 2.184z"
            />
          </svg>
          {copiedShare ? "Copied Link!" : "Share Profile"}
        </button>
      </div>

      {/* Main Layout Card */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-0 sm:px-6 md:px-8 flex flex-col gap-6">
        {/* Large Player Arena Banner Card */}
        <div className="relative overflow-hidden rounded-none sm:rounded-3xl border border-white/8 bg-[#090715]/40 backdrop-blur-md p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          {/* Custom Banner Flag Background */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.35] pointer-events-none"
            style={{ backgroundImage: `url('${bannerBg}')` }}
          />
          {/* Soccer Field Lines Overlay */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.20] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url('/bg_img.webp')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0724]/90 via-[#0a0c16]/80 to-[#0b061d]/90 z-0 pointer-events-none" />

          {/* Banner Left Details */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#8B5CF6] via-transparent to-[#06B6D4] p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.45)] overflow-hidden">
                {player.avatar_url ? (
                  <Image
                    src={player.avatar_url}
                    alt={player.name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#121626] flex items-center justify-center font-black text-3xl text-slate-100 uppercase tracking-widest">
                    {getInitials(player.name)}
                  </div>
                )}
              </div>

              {isOwner && (
                <label
                  htmlFor="banner-avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center rounded-full cursor-pointer shadow-lg border-2 border-[#090715] transition-all transform hover:scale-110 active:scale-95"
                  title="Edit Avatar"
                >
                  {uploading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  )}
                  <input
                    id="banner-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold tracking-wide text-white uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                  {player.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-1 text-xs text-slate-300">
                {player.team && (
                  <span className="font-semibold flex items-center gap-1.5">
                    <span
                      className={`fi fi-${countryCode} rounded-sm shadow-sm scale-110`}
                    />
                    {getTeamName(player.team)}
                  </span>
                )}
                {player.institutions && (
                  <>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="font-medium text-slate-400">
                      {player.institutions}
                    </span>
                  </>
                )}
                {player.role && player.role !== "player" && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      player.role === "captain"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                        : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                    }`}
                  >
                    {player.role === "captain" ? "Captain" : "Vice Captain"}
                  </span>
                )}
                <span
                  className="w-4 h-4 bg-violet-600/95 text-white flex items-center justify-center rounded-full text-[9px] font-black shadow-md shadow-violet-600/30"
                  title="Verified Player"
                >
                  ✓
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <div className="flex items-center gap-2 bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 rounded-full px-3 py-0.5">
                  <span className="text-[10px] font-black uppercase text-[#a78bfa] tracking-wider">
                    LVL {level}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {xpInLevel} / {nextXp > 0 ? nextXp : "MAX"} XP
                </span>
              </div>
            </div>
          </div>

          {/* Banner Right Controls */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-center shrink-0">
            <button
              onClick={handleDownloadCard}
              className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs font-semibold tracking-wide text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
            >
              <svg
                className="w-4 h-4"
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
              {downloadingCard ? "Generating..." : "Download Card"}
            </button>

            {currentUser &&
              (currentUser.role === "captain" ||
                currentUser.role === "vicecaptain") && (
                <Link
                  href="/captain"
                  className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50 rounded-xl text-xs font-semibold tracking-wide text-violet-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto"
                >
                  <svg
                    className="w-4 h-4 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3L16 7L21 4L19 16H5L3 4L8 7L12 3Z"
                    />
                  </svg>
                  Captain Room
                </Link>
              )}

            {isOwner && (
              <button
                onClick={() => openModalWithTab("profile")}
                className="cursor-pointer flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8B5CF6]/20 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2.5 px-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
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

        {/* 2-Column Dashboard Body */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full mt-2">
          {/* Left Column: Player FIFA Card */}
          <div className="flex justify-center shrink-0 w-full lg:w-[420px] xl:w-[528px] bg-[#090715]/40 border border-white/5 backdrop-blur-md rounded-none sm:rounded-3xl p-0 sm:p-6 shadow-xl relative overflow-hidden items-center">
            <div className="absolute top-[10%] left-[10%] w-[180px] h-[180px] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.1)_0%,_transparent_60%)] pointer-events-none rounded-full" />
            <PlayerCard
              player={player}
              goals={Math.floor(player.mu_points / 7)}
              assists={referralCount}
              challenges={player.completed_tasks_count || 0}
            />
          </div>

          {/* Right Column: Player Overview & Stats */}
          <div className="flex-1 flex flex-col gap-6">
            {/* PLAYER OVERVIEW SECTION */}
            <div className="bg-[#090715]/40 border border-white/8 backdrop-blur-md rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 border-b border-white/5 pb-2.5">
                  Player Overview
                </h3>

                {/* 4 Stats Cards Grid (Vertical Box Layout) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {/* Points Card */}
                  <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                      <svg
                        className="w-6 h-6 text-violet-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <span className="text-2xl font-black text-white leading-none">
                      {player.mu_points || 0}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 mt-2">
                      μPoints
                    </span>
                  </div>

                  {/* Rank Card */}
                  <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-black text-white leading-none">
                      #{player.rank || 12}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                      Global Rank
                    </span>
                  </div>

                  {/* Challenges Card */}
                  <Link href="/tasks" className="block">
                    <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <svg
                          className="w-6 h-6 text-emerald-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <span className="text-2xl font-black text-white leading-none">
                        {player.completed_tasks_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                        Challenges
                      </span>
                    </div>
                  </Link>

                  {/* Overall Rating Card */}
                  <div className="bg-[#0b0c16]/60 border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] duration-300 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                      <svg
                        className="w-6 h-6 text-amber-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-2xl font-black text-white leading-none">
                      {ovr}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                      Overall Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* LEVEL PROGRESS SECTION */}
              <div className="bg-[#100e23]/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-2 mt-4">
                <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                  Level Progress
                </span>
                <div className="flex items-center justify-between text-sm font-extrabold mt-1">
                  <span className="text-[#8B5CF6]">Level {level}</span>
                  <span className="text-slate-400 font-medium">
                    {nextXp > 0
                      ? `${nextXp - xpInLevel} XP to Level ${level + 1}`
                      : "Max Level Reached"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full transition-all duration-500"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-300">
                    {xpPercent}%
                  </span>
                </div>
              </div>

              {/* NATION STANDING SECTION */}
              {player.team && (
                <div className="bg-[#100e23]/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-3 mt-4">
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                    Nation Standing
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                        <span className={`fi fi-${countryCode} scale-125`} />
                      </div>
                      <span className="text-sm font-extrabold text-white">
                        {player.team} Rank #{nationRank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <span>Contribution</span>
                      <span className="text-[#10B981] font-extrabold">
                        {nationContribution}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mt-1">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                      style={{ width: `${nationContribution}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase">
                    Top {nationPercentage}% of {player.team} Players
                  </span>
                </div>
              )}
            </div>

            {/* ACHIEVEMENTS SECTION (LOCKED & BLURRED) */}
            <div className="bg-[#090715]/40 border border-white/8 backdrop-blur-md rounded-none sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">
                  Achievements
                </h3>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  Locked
                </span>
              </div>

              {/* Badges container with relative position for the lock overlay */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* Centered Non-Overflowing Badges List (Blurred and non-interactive) */}
                <div className="flex items-center justify-center gap-4 pb-1 pr-0 flex-wrap blur-[3px] pointer-events-none select-none">
                  {achievementsList.slice(0, 4).map((badge, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border min-w-[110px] flex-1 max-w-[140px] transition-all ${
                        badge.earned
                          ? "bg-[#100e23]/60 border-violet-500/10"
                          : "bg-[#100e23]/20 border-white/5 opacity-40"
                      }`}
                    >
                      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                        {badge.earned ? (
                          <Image
                            src={badge.icon}
                            alt={badge.name}
                            width={56}
                            height={56}
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                            <svg
                              className="w-5 h-5 text-slate-500"
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
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-slate-200 leading-tight mt-1">
                        {badge.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 leading-none">
                        {badge.earned ? badge.desc : "Locked"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Premium Lock Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] z-20">
                  <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
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
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-amber-500 mt-3 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                    Achievements locked
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    Unlocks at Level 10
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: HISTORY REDIRECT & SETTINGS */}
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
                  You must be logged in as the owner to view or edit account
                  settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Overlay Modal (Tabbed Layout) */}
      {isEditOpen && (
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
                  setEditError("");
                  setEditSaved(false);
                }}
                className={`pb-1.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeTab === "profile"
                    ? "border-violet-500 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                Profile Info
              </button>
              <button
                onClick={() => {
                  setActiveTab("password");
                  setPasswordError("");
                  setPasswordSuccess(false);
                }}
                className={`pb-1.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeTab === "password"
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
                        <span>🔒</span> Already set. If incorrect, contact an
                        Admin.
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 select-none">
                        <span>⚠️</span> Once saved, this can only be edited by
                        an Admin.
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
              <form
                onSubmit={handlePasswordSubmit}
                className="flex flex-col gap-4"
              >
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
      )}

      {/* Delete Account Double Confirmation Modal */}
      {showDeleteModal && (
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
                <span className="font-extrabold text-red-400">DELETE</span>{" "}
                below:
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
      )}
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
