"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import PlayerCard from "@/components/PlayerCard";
import { usePlayer } from "@/components/PlayerContext";
import { useProfileState } from "./components/useProfileState";
import ProfileHeader from "./components/ProfileHeader";
import ProfileBanner from "./components/ProfileBanner";
import PlayerOverview from "./components/PlayerOverview";
import Achievements from "./components/Achievements";
import AccountSettings from "./components/AccountSettings";
import ProfileEditModal from "./components/ProfileEditModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

function ProfilePageContent({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const { player: currentUser, refreshPlayer } = usePlayer();

  const profile = useProfileState(id, currentUser, refreshPlayer);

  if (profile.loading) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (profile.error || !profile.player) {
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
              {profile.error || "The requested player profile could not be found."}
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

  return (
    <div className="w-full relative flex flex-col gap-6 pt-20 sm:pt-24 pb-12 select-none">
      {/* Stadium background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/stadium_bg_pruble.webp')` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#04050a]/80 via-[#04050a]/60 to-[#04050a]/90 pointer-events-none" />

      {/* Top Header Section */}
      <ProfileHeader
        copiedShare={profile.copiedShare}
        handleShareProfile={profile.handleShareProfile}
      />

      {/* Main Layout Card */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-0 sm:px-6 md:px-8 flex flex-col gap-6">
        {/* Large Player Arena Banner Card */}
        <ProfileBanner
          player={profile.player}
          equippedFrame={profile.equippedFrame}
          isOwner={profile.isOwner}
          uploading={profile.uploading}
          handleAvatarChange={profile.handleAvatarChange}
          level={profile.levelData.level}
          xpInLevel={profile.levelData.currentLevelXp}
          nextXp={profile.levelData.nextXp}
          downloadingCard={profile.downloadingCard}
          handleDownloadCard={profile.handleDownloadCard}
          currentUser={currentUser}
          openModalWithTab={profile.openModalWithTab}
          bannerBg={profile.bannerBg}
          countryCode={profile.countryCode}
        />

        {profile.uploadError && (
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
            {profile.uploadError}
          </div>
        )}

        {/* 2-Column Dashboard Body */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full mt-2">
          {/* Left Column: Player FIFA Card */}
          <div className="flex justify-center shrink-0 w-full lg:w-[420px] xl:w-[528px] bg-[#090715]/40 border border-white/5 backdrop-blur-md rounded-none sm:rounded-3xl p-0 sm:p-6 shadow-xl relative overflow-hidden items-center">
            <div className="absolute top-[10%] left-[10%] w-[180px] h-[180px] bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.1)_0%,_transparent_60%)] pointer-events-none rounded-full" />
            <PlayerCard
              player={profile.player}
              goals={profile.goals}
              assists={profile.referralCount}
              challenges={profile.player.completed_tasks_count || 0}
            />
          </div>

          {/* Right Column: Player Overview & Stats */}
          <div className="flex-1 flex flex-col gap-6">
            <PlayerOverview
              player={profile.player}
              stats={profile.stats}
              ovr={profile.ovr}
              levelData={profile.levelData}
              nationRank={profile.nationRank}
              nationContribution={profile.nationContribution}
              nationPercentage={profile.nationPercentage}
              countryCode={profile.countryCode}
            />

            <Achievements
              achievementsList={profile.achievementsList}
            />
          </div>
        </div>

        {/* BOTTOM SECTION: HISTORY REDIRECT & SETTINGS */}
        <AccountSettings
          isOwner={profile.isOwner}
          openModalWithTab={profile.openModalWithTab}
          setShowDeleteModal={profile.setShowDeleteModal}
          handleLogout={profile.handleLogout}
        />
      </div>

      {/* Account Settings Overlay Modal */}
      <ProfileEditModal
        isEditOpen={profile.isEditOpen}
        setIsEditOpen={profile.setIsEditOpen}
        activeTab={profile.activeTab}
        setActiveTab={profile.setActiveTab}
        editForm={profile.editForm}
        setEditForm={profile.setEditForm}
        editSaved={profile.editSaved}
        editError={profile.editError}
        handleEditSubmit={profile.handleEditSubmit}
        claimedFrames={profile.claimedFrames}
        player={profile.player}
        passwordForm={profile.passwordForm}
        setPasswordForm={profile.setPasswordForm}
        passwordError={profile.passwordError}
        passwordSuccess={profile.passwordSuccess}
        passwordLoading={profile.passwordLoading}
        handlePasswordSubmit={profile.handlePasswordSubmit}
      />

      {/* Delete Account Double Confirmation Modal */}
      <DeleteConfirmModal
        showDeleteModal={profile.showDeleteModal}
        setShowDeleteModal={profile.setShowDeleteModal}
        deleteConfirmText={profile.deleteConfirmText}
        setDeleteConfirmText={profile.setDeleteConfirmText}
        isDeleting={profile.isDeleting}
        deleteError={profile.deleteError}
        setDeleteError={profile.setDeleteError}
        handleDeleteAccount={profile.handleDeleteAccount}
        player={profile.player}
      />
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
