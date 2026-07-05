"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { TEAM_WHATSAPP_LINKS, WHO_AM_I_OPTIONS, KERALA_COLLEGES } from "@/utils/constants";

const renderTextWithMu = (text) => {
  if (typeof text !== "string") return text;
  const parts = text.split(/([µμ])/g);
  return parts.map((part, index) => {
    if (part === "µ" || part === "μ") {
      return (
        <span key={index} className="normal-case font-sans">
          μ
        </span>
      );
    }
    return part;
  });
};

export default function OnboardingModal({
  isOpen,
  onClose,
  player,
  refreshPlayer,
  sidebarCollapsed,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [active, setActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Who Am I step state
  const [whoami, setWhoami] = useState("");
  const [college, setCollege] = useState("");
  const [customCollege, setCustomCollege] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [whoamiSaving, setWhoamiSaving] = useState(false);

  const steps = useMemo(
    () => [
      {
        title: "Welcome to µFIFA '26",
        subtitle: "The Arena Overview",
        description:
          "Welcome to the ultimate innovation arena! µFIFA is a gamified learning movement by µLearn that turns learning and peer achievement into an interactive tournament.",
        image: "/onboarding/1.webp",
        target: null,
      },
      {
        title: "Your Profile Dashboard",
        subtitle: "Dashboard & Profile",
        description:
          "Track your user profile details, check your current level, see your accumulated µPoints, and copy your referral link to earn extra points by inviting friends.",
        image: "/onboarding/2.webp",
        target: "overview",
      },
      {
        title: "Challenges",
        subtitle: "Challenges Panel",
        description:
          "Complete sequential challenges curated for your domain. Earn XP to level up your card and earn µPoints upon manual or automated review.",
        image: "/onboarding/3.webp",
        target: "challenges",
      },
      {
        title: "μPredict Matches",
        subtitle: "Match Prediction Hub",
        description:
          "Put your predictive skills to the test! Predict scores of actual FIFA World Cup matches, track live standings, and win big µPoints for correct guesses.",
        image: "/onboarding/4.webp",
        target: "upredict",
      },
      {
        title: "Live Standings Leaderboard",
        subtitle: "Leaderboard & Stats",
        description:
          "Watch the country team rankings, domain leaderboards, and player standings update in real-time. Keep completing tasks to push your team to the top of the global standing!",
        image: "/onboarding/5.webp",
        target: "leaderboard",
      },
      {
        title: "Your Arena Profile",
        subtitle: "Player Profile",
        description:
          "Your profile card is your identity in the arena. View your XP breakdown across all domains, your current level, achievements, and referral stats — all in one place.",
        image: "/onboarding/5.webp",
        target: "profile",
        mobileTarget: "mobile-header-profile",
      },
      {
        title: "µPoints & History",
        subtitle: "Points Balance",
        description:
          "Track your µPoints balance earned through tasks, referrals, and predictions. Tap 'View History' to see a full log of every transaction — when you earned them and why.",
        image: "/onboarding/5.webp",
        target: "points",
        mobileTarget: "mobile-header-xp",
      },
      {
        title: "Join Your WhatsApp Squad",
        subtitle: "Squad Group",
        description: `Collaborate with peers representing your same country (${player?.team || "your country"})! Join your official squad's WhatsApp group to coordinate, ask questions, share resources, and lead your nation to victory.`,
        image: "/onboarding/6.webp",
        target: null,
      },
    ],
    [player?.team],
  );

  // Full steps including the WhoAmI step inserted before WhatsApp
  const allSteps = useMemo(() => {
    const whoamiStep = {
      title: "One Last Thing",
      subtitle: "About You",
      description: "Tell us a bit about yourself so we can show you in the right college leaderboard.",
      image: "/onboarding/5.webp",
      target: null,
      isWhoAmI: true,
    };
    return [...steps.slice(0, steps.length - 1), whoamiStep, steps[steps.length - 1]];
  }, [steps]);

  // Trigger entry transitions when the modal opens.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setActive(true), 50);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
    }
  }, [isOpen]);

  // Sync isMobile state after component mounting to prevent server-client mismatches.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // If the user is already onboarded but lacks whoami, start them directly on the whoami step.
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const onboarded = localStorage.getItem("mufifa_onboarded_v1");
      if (onboarded && !player?.whoami) {
        const index = allSteps.findIndex((s) => s.isWhoAmI);
        if (index !== -1) {
          setCurrentStep(index);
        }
      }
    }
  }, [isOpen, player, allSteps]);

  // Calculate the position of target elements dynamically to align tooltips and highlights.
  useEffect(() => {
    if (!isOpen) return;

    let activeElement = null;

    const updatePositionAndHighlight = () => {
      // Clear previous highlight class
      if (activeElement) {
        activeElement.classList.remove("tour-highlight");
        activeElement = null;
      }

      const currentStepData = allSteps[currentStep];
      if (!currentStepData || !currentStepData.target) {
        setCoords(null);
        return;
      }

      const isMobile = window.innerWidth < 768;

      // If step has a mobileTarget, resolve that directly on mobile
      let targetId;
      if (isMobile && currentStepData.mobileTarget) {
        targetId = currentStepData.mobileTarget;
      } else {
        targetId = isMobile
          ? `mobile-tab-item-${currentStepData.target}`
          : `sidebar-item-${currentStepData.target}`;
      }

      let element = document.getElementById(targetId);

      // Fallback to sidebar ID on mobile if bottom tab not found
      if (!element && isMobile && !currentStepData.mobileTarget) {
        element = document.getElementById(
          `sidebar-item-${currentStepData.target}`,
        );
      } else if (!element && !isMobile) {
        element = document.getElementById(
          `mobile-tab-item-${currentStepData.target}`,
        );
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });

        // Add class to lift element above backdrop and make it fully bright
        element.classList.add("tour-highlight");
        activeElement = element;
      } else {
        setCoords(null);
      }
    };

    const timer = setTimeout(updatePositionAndHighlight, 120);
    window.addEventListener("resize", updatePositionAndHighlight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePositionAndHighlight);
      if (activeElement) {
        activeElement.classList.remove("tour-highlight");
      }
    };
  }, [currentStep, isOpen, allSteps]);

  if (!isOpen) return null;

  const handleNext = async () => {
    const step = allSteps[currentStep];
    if (step?.isWhoAmI) {
      // Validate whoami + college
      if (!whoami) return;
      if (whoami === "College Student") {
        if (!college) return;
        if (college === "Other" && !customCollege.trim()) return;
      }

      // Save whoami + college before advancing
      if (player?.user_id) {
        setWhoamiSaving(true);
        try {
          const institutionsValue =
            whoami === "College Student"
              ? college === "Other" ? customCollege.trim() : college
              : "";
          const res = await fetch(`/api/v1/profile/${encodeURIComponent(player.user_id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              whoami,
              ...(institutionsValue ? { institutions: institutionsValue } : {}),
            }),
          });
          if (res.ok && refreshPlayer) {
            await refreshPlayer();
          }
        } catch (err) {
          console.error("WhoAmI save error:", err);
          return; // Do not advance on error
        } finally {
          setWhoamiSaving(false);
        }
      }
    }
    if (currentStep < allSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("mufifa_onboarded_v1", "true");
    onClose();
  };

  const stepData = allSteps[currentStep];
  const isLastStep = currentStep === allSteps.length - 1;
  const isWhoAmIStep = !!stepData?.isWhoAmI;
  const whatsappLink = player?.team ? TEAM_WHATSAPP_LINKS[player.team] : null;

  const isNextDisabled = useMemo(() => {
    if (whoamiSaving) return true;
    if (isWhoAmIStep) {
      if (!whoami) return true;
      if (whoami === "College Student") {
        if (!college) return true;
        if (college === "Other" && !customCollege.trim()) return true;
      }
    }
    return false;
  }, [whoamiSaving, isWhoAmIStep, whoami, college, customCollege]);

  // Dynamic layout calculations
  let tooltipStyle = {};
  let placementClass = "centered";

  if (coords) {
    if (isMobile) {
      const isTopNav = coords.top < window.innerHeight * 0.15; // element is in the top 15% (mobile header)
      if (isTopNav) {
        // Element is in the top navbar — place tooltip BELOW it
        tooltipStyle = {
          position: "fixed",
          top: `${coords.bottom + 16}px`,
          bottom: "auto",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 2rem)",
          maxWidth: "340px",
          zIndex: 100,
        };
        placementClass = "bottom";
      } else {
        // Element is in the bottom nav — place tooltip ABOVE it
        tooltipStyle = {
          position: "fixed",
          bottom: `${window.innerHeight - coords.top + 28}px`,
          top: "auto",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 2rem)",
          maxWidth: "340px",
          zIndex: 100,
        };
        placementClass = "top";
      }
    } else {
      tooltipStyle = {
        position: "fixed",
        top: `${coords.top + coords.height / 2}px`,
        bottom: "auto",
        left: `${coords.right + 28}px`,
        transform: "translateY(-50%)",
        width: "350px",
        zIndex: 100,
      };
      placementClass = "right";
    }
  } else {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      bottom: "auto",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "calc(100% - 2rem)",
      maxWidth: "400px",
      zIndex: 100,
    };
    placementClass = "center";
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden pointer-events-none transition-all duration-500 ${active ? "opacity-100" : "opacity-0"}`}
    >
      {/* Inject animations and style overrides to highlight active page components. */}
      <style>{`
        @keyframes float-right {
          0%, 100% { transform: translateY(-50%) translateX(0px); }
          50% { transform: translateY(-50%) translateX(-6px); }
        }
        @keyframes float-top {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        .tooltip-anim-right {
          animation: float-right 3.5s ease-in-out infinite;
        }
        .tooltip-anim-top {
          animation: float-top 3.5s ease-in-out infinite;
        }
        .tour-highlight {
          position: relative !important;
          z-index: 45 !important;
          pointer-events: none !important;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          color: white !important;
        }
        .tour-highlight span,
        .tour-highlight svg {
          color: white !important;
          opacity: 1 !important;
        }
      `}</style>

      {/* Render a full-screen flat backdrop when there is no targeted component highlight. */}
      {!coords && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[1.5px] pointer-events-auto z-40 transition-opacity duration-500" />
      )}

      {/* Dim the background and intercept clicks outside of active highlighted areas. */}
      {coords && (
        <>
          {isMobile ? (
            <>
              {placementClass === "top" ? (
                /* Dim all space above the highlighted bottom navigation bar to focus attention. */
                <div
                  className="fixed left-0 right-0 top-0 z-[45] pointer-events-auto bg-black/70 backdrop-blur-[1.5px] transition-all duration-300"
                  style={{ height: `${coords.top}px` }}
                />
              ) : (
                /* Dim all space below the highlighted mobile header. */
                <div
                  className="fixed left-0 right-0 bottom-0 z-[45] pointer-events-auto bg-black/70 backdrop-blur-[1.5px] transition-all duration-300"
                  style={{ top: `${coords.bottom}px` }}
                />
              )}
            </>
          ) : (
            /* Dim the desktop dashboard main content workspace while blocking sidebar interactions. */
            <>
              <div
                className="fixed top-0 bottom-0 right-0 z-[45] overflow-hidden pointer-events-auto transition-all duration-300"
                style={{ left: sidebarCollapsed ? "0px" : "256px" }}
              >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[1.5px]" />
              </div>
              <div
                className="fixed top-0 bottom-0 left-0 z-[45] pointer-events-auto transition-all duration-300"
                style={{ width: sidebarCollapsed ? "0px" : "256px" }}
              />
            </>
          )}
        </>
      )}

      {/* Draw a glowing frame around the target element to focus the player's view. */}
      {coords && (
        <div
          className="fixed border-2 border-[#06B6D4] rounded-xl pointer-events-none z-50 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.4)] bg-transparent transition-all duration-300"
          style={{
            top: coords.top - 4,
            left: coords.left - 4,
            width: coords.width + 8,
            height: coords.height + 8,
          }}
        />
      )}

      {/* Render a decorative hand-drawn left-pointing arrow on desktop views. */}
      {coords &&
        !isMobile &&
        placementClass === "right" &&
        (() => {
          const GAP = 28;
          const W = 72;
          const H = 60;
          const boxLeft = coords.right + GAP / 2 - W / 2;
          const boxTop = coords.top + coords.height / 2 - H / 2;
          return (
            <div
              className="fixed pointer-events-none text-[#06B6D4] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] z-50 animate-pulse"
              style={{ left: boxLeft, top: boxTop, width: W, height: H }}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <path d="M 68,14 C 68,45 56,54 44,48 C 36,44 32,26 36,20 C 40,14 48,18 46,30 C 44,42 30,44 16,30 L 3,30" />
                <path d="M 3,30 L 11,24" />
                <path d="M 3,30 L 11,36" />
              </svg>
            </div>
          );
        })()}

      {/* Render a decorative hand-drawn down-pointing arrow on mobile views. */}
      {coords &&
        isMobile &&
        placementClass === "top" &&
        (() => {
          const GAP = 28;
          const W = 44;
          const H = 60;
          const boxTop = coords.top - GAP / 2 - H / 2;
          const boxLeft = coords.left + coords.width / 2 - W / 2;
          return (
            <div
              className="fixed pointer-events-none text-[#06B6D4] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] z-50 animate-pulse"
              style={{ left: boxLeft, top: boxTop, width: W, height: H }}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <path
                  d={`M ${W * 0.2},${H * 0.06} C ${W * 0.9},${H * 0.06} ${W * 0.96},${H * 0.3} ${W * 0.86},${H * 0.52} C ${W * 0.76},${H * 0.7} ${W * 0.4},${H * 0.74} ${W * 0.32},${H * 0.62} C ${W * 0.24},${H * 0.5} ${W * 0.4},${H * 0.4} ${W * 0.6},${H * 0.46} C ${W * 0.78},${H * 0.52} ${W * 0.5},${H * 0.75} ${W * 0.5},${H * 0.92}`}
                />
                <path
                  d={`M ${W * 0.5},${H * 0.92} L ${W * 0.5 - 7},${H * 0.92 - 8}`}
                />
                <path
                  d={`M ${W * 0.5},${H * 0.92} L ${W * 0.5 + 7},${H * 0.92 - 8}`}
                />
              </svg>
            </div>
          );
        })()}

      {/* Render a decorative hand-drawn up-pointing arrow on mobile views. */}
      {coords &&
        isMobile &&
        placementClass === "bottom" &&
        (() => {
          const GAP = 16;
          const W = 44;
          const H = 60;
          const boxTop = coords.bottom + GAP / 2 - H / 2;
          const boxLeft = coords.left + coords.width / 2 - W / 2;
          return (
            <div
              className="fixed pointer-events-none text-[#06B6D4] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] z-50 animate-pulse"
              style={{ left: boxLeft, top: boxTop, width: W, height: H }}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <path
                  d={`M ${W * 0.2},${H * 0.94} C ${W * 0.9},${H * 0.94} ${W * 0.96},${H * 0.7} ${W * 0.86},${H * 0.48} C ${W * 0.76},${H * 0.3} ${W * 0.4},${H * 0.26} ${W * 0.32},${H * 0.38} C ${W * 0.24},${H * 0.5} ${W * 0.4},${H * 0.6} ${W * 0.6},${H * 0.54} C ${W * 0.78},${H * 0.48} ${W * 0.5},${H * 0.25} ${W * 0.5},${H * 0.08}`}
                />
                <path
                  d={`M ${W * 0.5},${H * 0.08} L ${W * 0.5 - 7},${H * 0.08 + 8}`}
                />
                <path
                  d={`M ${W * 0.5},${H * 0.08} L ${W * 0.5 + 7},${H * 0.08 + 8}`}
                />
              </svg>
            </div>
          );
        })()}

      {/* Render the main guide card containing step details and navigation actions. */}
      <div
        className={`bg-[#0b091a]/95 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 pointer-events-auto backdrop-blur-md transition-all duration-500 ease-out ${
          placementClass === "right"
            ? "tooltip-anim-right"
            : placementClass === "top"
              ? "tooltip-anim-top"
              : ""
        } ${active ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        style={tooltipStyle}
      >
        {/* Visual preview image associated with the onboarding step. */}
        <div className="relative w-full h-[150px] bg-slate-950/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 p-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.12)_0%,_transparent_75%)]" />
          <div className="relative w-full h-full">
            <Image
              src={stepData.image}
              alt={stepData.title}
              fill
              sizes="(max-width: 768px) 100vw, 350px"
              className="object-contain drop-shadow-[0_0_15px_rgba(79,70,229,0.25)] rounded-lg"
              priority
            />
          </div>
        </div>

        {/* Step indicators, title, and descriptive text. */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#06B6D4]">
              {renderTextWithMu(stepData.subtitle)}
            </span>
            <span className="text-[9px] font-bold text-slate-500">
              {currentStep + 1} / {allSteps.length}
            </span>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
            {renderTextWithMu(stepData.title)}
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium mt-1">
            {renderTextWithMu(stepData.description)}
          </p>
        </div>

        {/* Who Am I interactive section */}
        {isWhoAmIStep && (
          <div className="flex flex-col gap-3">
            {/* 3-card selector */}
            <div className="grid grid-cols-3 gap-2">
              {WHO_AM_I_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setWhoami(opt);
                    setCollege("");
                    setCustomCollege("");
                    setCollegeSearch("");
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    whoami === opt
                      ? opt === "College Student"
                        ? "bg-[#4F46E5]/20 border-[#4F46E5]/60 text-[#a5b4fc]"
                        : opt === "School Student"
                        ? "bg-[#06B6D4]/20 border-[#06B6D4]/60 text-[#67e8f9]"
                        : "bg-white/10 border-white/30 text-white"
                      : "bg-white/[0.03] border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  {/* Icon */}
                  {opt === "College Student" && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
                      <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
                    </svg>
                  )}
                  {opt === "School Student" && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  )}
                  {opt === "Other" && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
                    </svg>
                  )}
                  <span className="text-center leading-tight">
                    {opt === "College Student" ? "College" : opt === "School Student" ? "School" : "Other"}
                  </span>
                </button>
              ))}
            </div>

            {/* College picker */}
            {whoami === "College Student" && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={collegeSearch}
                  onChange={(e) => { setCollegeSearch(e.target.value); setCollege(""); }}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
                <div className="max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-black/30">
                  {KERALA_COLLEGES.filter((c) =>
                    c.toLowerCase().includes(collegeSearch.toLowerCase())
                  ).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCollege(c); setCustomCollege(""); }}
                      className={`w-full text-left px-3 py-1.5 text-[10px] border-b border-white/[0.04] last:border-b-0 cursor-pointer transition-colors ${
                        college === c
                          ? "text-[#a5b4fc] bg-[#4F46E5]/10 font-bold"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  {KERALA_COLLEGES.filter((c) =>
                    c.toLowerCase().includes(collegeSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-3 py-3 text-[10px] text-slate-600 text-center">
                      No match — select &quot;Other&quot; above.
                    </div>
                  )}
                </div>
                {college === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter your college name..."
                    value={customCollege}
                    onChange={(e) => setCustomCollege(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4F46E5] transition-colors animate-in fade-in duration-150"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Show the official team channel join CTA on the final step. */}
        {isLastStep && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                whatsappLink || "https://chat.whatsapp.com/",
                "_blank",
                "noopener,noreferrer",
              );
              localStorage.setItem("mufifa_onboarded_v1", "true");
              onClose();
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-1.5 hover:scale-[1.01] cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328.002 11.905.002c3.186 0 6.182 1.24 8.432 3.493 2.25 2.253 3.488 5.251 3.486 8.44-.003 6.578-5.328 11.9-11.902 11.9-2.005-.001-3.973-.504-5.731-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.747 1.452 5.385 0 9.766-4.38 9.769-9.764.001-2.61-1.014-5.064-2.858-6.91a9.711 9.711 0 00-6.912-2.854C6.012 3.078 1.63 7.46 1.627 12.845c-.001 1.639.433 3.236 1.256 4.662l-.993 3.628 3.757-.985z" />
            </svg>
            <span>JOIN SQUAD WHATSAPP</span>
          </button>
        )}

        {/* Navigation controls for moving back and forth through the slides. */}
        <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-3.5">
          <div className="flex gap-2 shrink-0">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] tracking-wide uppercase rounded-lg transition-all cursor-pointer"
              >
                Back
              </button>
            )}
            {!isLastStep && (
              <button
                onClick={handleNext}
                disabled={isNextDisabled}
                className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[10px] tracking-wide uppercase rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {whoamiSaving && <span className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
