import { useState, useEffect, useMemo, useCallback } from "react";
import { TEAM_FLAGS, TEAM_FLAG_BGS, calculateLevel } from "@/utils/constants";

export function useProfileState(id, currentUser, refreshPlayer) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    phone: "",
    muid: "",
    institutions: "",
    equippedFrame: "",
  });
  const [editSaved, setEditSaved] = useState(false);
  const [editError, setEditError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [downloadingCard, setDownloadingCard] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Parse tasks and extract equippedFrame
  const equippedFrame = useMemo(() => {
    if (!player || !player.tasks) return "";
    if (typeof player.tasks === "object") {
      return player.tasks.equipped_frame || "";
    }
    if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        return parsed.equipped_frame || "";
      } catch (e) {
        console.error("Failed to parse player tasks JSON string:", e);
      }
    }
    return "";
  }, [player]);

  // Extract claimed avatar frames from claims list
  const claimedFrames = useMemo(() => {
    return (player?.claims || [])
      .filter((claim) => claim.merch_items && claim.merch_items.tag === "Avatar Frame")
      .map((claim) => claim.merch_items.title);
  }, [player]);

  const isOwner = useMemo(() => {
    return !!(currentUser && player && currentUser.id === player.id);
  }, [currentUser, player]);

  // Dynamic calculations: XP breakdown, OVR stats, levels
  const stats = useMemo(() => {
    if (!player) return { creativity: 0, branding: 0, innovation: 0, teamwork: 0, execution: 0 };
    const xp = player.xp_breakdown || {};
    const refXp = player.avg_highest_xp && player.avg_highest_xp > 0 ? player.avg_highest_xp : 38;
    return {
      creativity: Math.min(99, Math.round(((xp.creativity || 0) / refXp) * 99)),
      branding: Math.min(99, Math.round(((xp.branding || 0) / refXp) * 99)),
      innovation: Math.min(99, Math.round(((xp.innovation || 0) / refXp) * 99)),
      teamwork: Math.min(99, Math.round(((xp.teamwork || 0) / refXp) * 99)),
      execution: Math.min(99, Math.round(((xp.execution || 0) / refXp) * 99)),
    };
  }, [player]);

  const ovr = useMemo(() => {
    return Math.round(Object.values(stats).reduce((a, b) => a + b, 0) / 5);
  }, [stats]);

  const totalXp = useMemo(() => {
    if (!player) return 0;
    const xp = player.xp_breakdown || {};
    return (
      (xp.creativity || 0) +
      (xp.branding || 0) +
      (xp.innovation || 0) +
      (xp.teamwork || 0) +
      (xp.execution || 0)
    );
  }, [player]);

  const levelData = useMemo(() => {
    return calculateLevel(totalXp);
  }, [totalXp]);

  const nationRank = useMemo(() => {
    if (!player) return 4;
    return player.rank ? Math.max(1, (player.rank % 6) + 1) : 4;
  }, [player]);

  const nationContribution = useMemo(() => {
    if (!player) return 0;
    return Math.min(95, 30 + ((player.mu_points || 0) % 60));
  }, [player]);

  const nationPercentage = useMemo(() => {
    if (!player) return 25;
    return Math.max(1, Math.min(99, 25 - Math.floor((player.mu_points || 0) / 20)));
  }, [player]);

  const bannerBg = useMemo(() => {
    return player?.team && TEAM_FLAG_BGS[player.team] ? TEAM_FLAG_BGS[player.team] : "/bg_img.webp";
  }, [player?.team]);

  const referralCount = useMemo(() => {
    if (!player || !player.tasks) return 0;
    if (typeof player.tasks === "object") {
      return player.tasks.referal || 0;
    }
    if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        return parsed.referal || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }, [player]);

  const countryCode = useMemo(() => {
    return player?.team ? TEAM_FLAGS[player.team] || "un" : "un";
  }, [player?.team]);

  const achievementsList = useMemo(() => {
    if (!player) return [];
    return [
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
        earned: (player.mu_points || 0) >= 10,
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
  }, [player, referralCount]);

  const goals = useMemo(() => {
    return player ? Math.floor((player.mu_points || 0) / 7) : 0;
  }, [player]);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    try {
      const profileRes = await fetch(`/api/v1/profile/${encodeURIComponent(id)}`);
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.success) {
        setError(profileData.error?.message || "Profile not found.");
        setLoading(false);
        return;
      }

      const pData = profileData.data;
      setPlayer(pData);

      let eqFrame = "";
      if (pData.tasks) {
        if (typeof pData.tasks === "object") {
          eqFrame = pData.tasks.equipped_frame || "";
        } else if (typeof pData.tasks === "string") {
          try {
            const parsed = JSON.parse(pData.tasks);
            eqFrame = parsed.equipped_frame || "";
          } catch (e) {
            console.error("Failed to parse player tasks JSON string:", e);
          }
        }
      }

      setEditForm({
        name: pData.name || "",
        bio: pData.bio || "",
        phone: pData.phone || "",
        muid: pData.muid || "",
        institutions: pData.institutions || "",
        equippedFrame: eqFrame,
      });
    } catch (err) {
      console.error("Error fetching player profile:", err);
      setError("Unable to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [id, fetchProfile]);

  const handleLogout = useCallback(async () => {
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
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/v1/profile/${encodeURIComponent(player.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Failed to delete account. Please try again.");
        setIsDeleting(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account error:", err);
      setDeleteError("A network error occurred. Please try again.");
      setIsDeleting(false);
    }
  }, [deleteConfirmText, player?.id]);

  const handleAvatarChange = useCallback(async (e) => {
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
  }, [isOwner, refreshPlayer]);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    setEditSaved(false);
    setEditError("");

    let currentTasks = {};
    if (player?.tasks) {
      if (typeof player.tasks === "object") {
        currentTasks = { ...player.tasks };
      } else if (typeof player.tasks === "string") {
        try {
          currentTasks = JSON.parse(player.tasks);
        } catch (err) {
          console.error("Failed to parse tasks string:", err);
        }
      }
    }
    const updatedTasks = {
      ...currentTasks,
      equipped_frame: editForm.equippedFrame || "",
    };

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
          tasks: updatedTasks,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        setEditError(resData.error || "Failed to update profile details.");
        return;
      }

      setEditSaved(true);
      fetchProfile();
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
  }, [id, player?.tasks, editForm, fetchProfile, refreshPlayer]);

  const handlePasswordSubmit = useCallback(async (e) => {
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
  }, [passwordForm]);

  const handleDownloadCard = useCallback(async () => {
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
  }, [downloadingCard, player?.user_id]);

  const handleShareProfile = useCallback(() => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  }, []);

  const openModalWithTab = useCallback((tab) => {
    setActiveTab(tab);
    setIsEditOpen(true);
  }, []);

  return {
    player,
    loading,
    error,
    uploading,
    uploadError,
    setUploadError,
    editForm,
    setEditForm,
    editSaved,
    editError,
    handleEditSubmit,
    passwordForm,
    setPasswordForm,
    passwordError,
    passwordSuccess,
    passwordLoading,
    handlePasswordSubmit,
    isEditOpen,
    setIsEditOpen,
    activeTab,
    setActiveTab,
    openModalWithTab,
    showDeleteModal,
    setShowDeleteModal,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleting,
    deleteError,
    setDeleteError,
    handleDeleteAccount,
    downloadingCard,
    handleDownloadCard,
    copiedShare,
    handleShareProfile,
    equippedFrame,
    claimedFrames,
    isOwner,
    stats,
    ovr,
    levelData,
    nationRank,
    nationContribution,
    nationPercentage,
    bannerBg,
    referralCount,
    countryCode,
    achievementsList,
    goals,
    handleLogout,
  };
}
