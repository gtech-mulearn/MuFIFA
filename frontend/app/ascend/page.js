"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TaskCard from "./components/TaskCard";
import TaskSubmissionModal from "./components/TaskSubmissionModal";
import SubmissionCard from "./components/SubmissionCard";
import RegistrationModal from "./components/RegistrationModal";


import { isPastDeadline } from "@/utils/ascendDeadline";

// Circular Spotlight Lens Rocket Loader & Reveal Animation
function RocketCurtainRaiser({ onComplete }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Unmount curtain raiser completely at 3.4 seconds
    const unmountTimer = setTimeout(() => {
      setActive(false);
      if (onComplete) onComplete();
    }, 3400);

    return () => clearTimeout(unmountTimer);
  }, [onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center md:pl-64 animate-[fadeOutCurtain_0.9s_ease-out_2.5s_forwards]">
      {/* Dark Curtain Panel */}
      <div className="absolute inset-0 bg-[#07070a]" />

      {/* Central Circular Lens Spotlight Container */}
      <div className="relative z-10 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#f3f4f6] shadow-[0_0_90px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center overflow-hidden border border-slate-200/50">
        
        {/* Animated Speed Lines (Vertical on Mobile, Horizontal on Desktop) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Mobile Vertical Speed Lines */}
          <div className="md:hidden absolute left-1/4 bottom-0 w-1 h-12 bg-slate-400/40 rounded-full animate-[speedLineVertical_1.1s_linear_infinite]" />
          <div className="md:hidden absolute left-1/2 bottom-0 w-1 h-16 bg-slate-400/50 rounded-full animate-[speedLineVertical_0.8s_linear_infinite_0.3s]" />
          <div className="md:hidden absolute left-2/3 bottom-0 w-1 h-10 bg-slate-400/30 rounded-full animate-[speedLineVertical_1.4s_linear_infinite_0.15s]" />
          <div className="md:hidden absolute left-3/4 bottom-0 w-1 h-14 bg-slate-400/45 rounded-full animate-[speedLineVertical_0.9s_linear_infinite_0.5s]" />

          {/* Desktop Horizontal Speed Lines */}
          <div className="hidden md:block absolute top-1/4 right-0 w-12 h-1 bg-slate-400/40 rounded-full animate-[speedLine_1.1s_linear_infinite]" />
          <div className="hidden md:block absolute top-1/2 right-0 w-16 h-1 bg-slate-400/50 rounded-full animate-[speedLine_0.8s_linear_infinite_0.3s]" />
          <div className="hidden md:block absolute top-2/3 right-0 w-10 h-1 bg-slate-400/30 rounded-full animate-[speedLine_1.4s_linear_infinite_0.15s]" />
          <div className="hidden md:block absolute top-3/4 right-0 w-14 h-1 bg-slate-400/45 rounded-full animate-[speedLine_0.9s_linear_infinite_0.5s]" />
        </div>

        {/* Central Flying Rocket Assembly */}
        <div className="relative z-10 flex items-center justify-center animate-[rocketFlyVertical_3.0s_cubic-bezier(0.25,1,0.5,1)_forwards] md:animate-[rocketFlyAcross_3.0s_cubic-bezier(0.25,1,0.5,1)_forwards]">
          
          {/* Amber Thruster Glow (Bottom on Mobile, Left on Desktop) */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-7 h-10 md:-left-8 md:top-1/2 md:-translate-y-1/2 md:w-10 md:h-7 md:bottom-auto md:translate-x-0 bg-amber-400/80 blur-md rounded-full animate-pulse z-0" />
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-10 h-14 md:-left-14 md:top-1/2 md:-translate-y-1/2 md:w-14 md:h-10 md:bottom-auto md:translate-x-0 bg-amber-500/40 blur-lg rounded-full z-0" />

          {/* Space Shuttle Rocket Asset (Pointing UPWARDS on Mobile, Rotated 90deg on Desktop) */}
          <img
            src="/ascend/shuttle_loader.png"
            alt="Space Shuttle Loader"
            className="w-20 sm:w-24 h-auto object-contain rotate-0 md:rotate-90 mix-blend-multiply filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)] relative z-10"
          />
        </div>

        {/* Loading Progress Section (at bottom of circle) */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 z-20">
          {/* Thin Progress Bar Line */}
          <div className="w-28 h-1 bg-slate-300 rounded-full overflow-hidden">
            <div className="h-full bg-slate-600 rounded-full animate-[progressFill_2.2s_ease-in-out_forwards]" />
          </div>

          {/* "Loading..." Text */}
          <span className="text-sm font-medium text-slate-400 tracking-wide">
            Loading...
          </span>
        </div>

      </div>

      <style jsx global>{`
        @keyframes speedLineVertical {
          0% {
            transform: translateY(120px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateY(-350px);
            opacity: 0;
          }
        }
        @keyframes speedLine {
          0% {
            transform: translateX(120px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(-350px);
            opacity: 0;
          }
        }
        @keyframes rocketFlyVertical {
          0% {
            transform: translate3d(0, 220px, 0) scale(0.85);
          }
          40% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          80% {
            transform: translate3d(0, -40px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, -350px, 0) scale(1.15);
          }
        }
        @keyframes rocketFlyAcross {
          0% {
            transform: translate3d(-200px, 0, 0) scale(0.9);
          }
          40% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          80% {
            transform: translate3d(40px, 0, 0) scale(1.05);
          }
          100% {
            transform: translate3d(350px, 0, 0) scale(1.15);
          }
        }
        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        @keyframes fadeOutCurtain {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.08);
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
}

export default function AscendPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showCurtainRaiser, setShowCurtainRaiser] = useState(true);

  // Tasks & Submissions state
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks"); // 'tasks' or 'submissions'

  // Live Sprint Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Verify authentication and registration state
  useEffect(() => {
    async function checkAuthAndRegistration() {
      try {
        setCheckingAuth(true);
        const res = await fetch("/api/v1/ascend/register");

        if (res.status === 401) {
          setIsAuthenticated(false);
          setRegistered(false);
          router.push("/login?redirect=/ascend");
          return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
          setIsAuthenticated(true);
          if (data.registered) {
            setRegistered(true);
            setUserRegistration(data.registration);
          } else {
            setRegistered(false);
          }
        } else {
          setIsAuthenticated(false);
          setRegistered(false);
          router.push("/login?redirect=/ascend");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
        setRegistered(false);
        router.push("/login?redirect=/ascend");
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthAndRegistration();
  }, [router]);

  // Fetch tasks and user submissions
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchData() {
      setLoadingTasks(true);
      try {
        const domainQuery = registered && userRegistration?.primary_domain
          ? `?domain=${encodeURIComponent(userRegistration.primary_domain)}`
          : "";
        const tasksRes = await fetch(`/api/v1/ascend/tasks${domainQuery}`);
        const tasksData = await tasksRes.json();
        if (tasksData.success && tasksData.tasks) {
          setTasks(tasksData.tasks);
        } else {
          setTasks([]);
        }

        const subRes = await fetch("/api/v1/ascend/submissions");
        const subData = await subRes.json();
        if (subData.success && subData.submissions) {
          setSubmissions(subData.submissions);
        }
      } catch (err) {
        console.error("Error fetching tasks/submissions:", err);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    }

    fetchData();
  }, [isAuthenticated, registered, userRegistration]);

  const refreshSubmissions = async () => {
    try {
      const subRes = await fetch("/api/v1/ascend/submissions");
      const subData = await subRes.json();
      if (subData.success && subData.submissions) {
        setSubmissions(subData.submissions);
      }
    } catch (err) {
      console.error("Error refreshing submissions:", err);
    }
  };

  const handleRegistrationSuccess = (regData) => {
    setRegistered(true);
    setUserRegistration(regData);
    setShowRegModal(false);
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Authenticating Candidate...
        </span>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#040406] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-md w-full bg-[#090815]/90 border border-white/20 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_80px_rgba(124,58,237,0.2)] flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs font-medium">
            You must be signed in with a valid account to access the Ascend tasks arena.
          </p>
          <a
            href="/login?redirect=/ascend"
            className="mt-2 w-full py-3.5 bg-white hover:bg-slate-100 text-black text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <span>Sign In to Access Ascend</span>
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </main>
    );
  }

  const isInitialQualificationTask = (task) => {
    if (!task) return false;
    if (task.is_initial) return true;
    const title = (task.title || "").toLowerCase();
    const desc = (task.description || "").toLowerCase();
    return (
      title.includes("initial qualification") ||
      title.includes("qualification task") ||
      desc.includes("initial qualification") ||
      desc.includes("qualification task")
    );
  };

  // Find user submission for initial qualification task
  const initialTaskSubmission = submissions.find((sub) => {
    const taskForSub =
      sub.ascend_tasks ||
      tasks.find((t) => Number(t.id) === Number(sub.task_id));
    return isInitialQualificationTask(taskForSub);
  });

  const initialTaskObj = tasks.find(isInitialQualificationTask);
  const initialTaskExists = Boolean(initialTaskObj);

  // Calculate if initial task was submitted after deadline
  const isSubmittedAfterDeadline = (() => {
    if (!initialTaskSubmission || !initialTaskSubmission.submitted_at) return false;
    const relatedTask =
      initialTaskSubmission.ascend_tasks ||
      tasks.find((t) => Number(t.id) === Number(initialTaskSubmission.task_id));
    return isPastDeadline(initialTaskSubmission.submitted_at, relatedTask?.deadline);
  })();

  // Initial qualification deadline gating ONLY applies if an initial task actually exists
  const isInitialDeadlinePassed = initialTaskExists
    ? isPastDeadline(new Date(), initialTaskObj.deadline)
    : false;

  const isSubmissionLate = (sub) => {
    if (!sub || !sub.submitted_at) return false;
    const taskObj =
      sub.ascend_tasks ||
      tasks.find((t) => Number(t.id) === Number(sub.task_id));
    return isPastDeadline(sub.submitted_at, taskObj?.deadline);
  };

  const validSubmissions = submissions.filter((sub) => !isSubmissionLate(sub));
  const hasSubmittedInitial = Boolean(initialTaskSubmission);

  // Filter tasks based on domain and initial task submission status
  const domainFilteredTasks = tasks.filter((task) => {
    if (!registered || !userRegistration?.primary_domain) return true;
    return task.domain === userRegistration.primary_domain;
  });

  const displayedTasks = domainFilteredTasks.filter((task) => {
    // If user submitted initial qualification task on time, ONLY show next tasks (exclude initial task)
    if (hasSubmittedInitial && !isSubmittedAfterDeadline) {
      return !isInitialQualificationTask(task);
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#07070a] text-slate-100 font-sans selection:bg-violet-500 selection:text-white relative overflow-x-hidden pb-24">
      
      {/* Subtle Ambient Glowing Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none animate-[ambientPulse_10s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none animate-[ambientPulse_12s_ease-in-out_infinite_alternate_2s]" />

      {/* Rocket Launch Curtain Raiser Reveal */}
      {showCurtainRaiser && (
        <RocketCurtainRaiser onComplete={() => setShowCurtainRaiser(false)} />
      )}

      {/* Container holding top header, timer strip, tabs, and 2-column body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col gap-8">
        
        {/* Top Header Section with Entrance Fade/Slide */}
        <div className="w-full flex flex-col gap-6 py-2 animate-[ascendFadeUp_0.8s_ease-out_forwards]">
          
          {/* Top Right Candidate Profile Control */}
          <div className="flex items-center justify-end w-full">
            {!registered ? (
              <button
                type="button"
                onClick={() => setShowRegModal(true)}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-violet-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <span>Register Candidate Profile</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                  CANDIDATE PROFILE
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegModal(true)}
                  aria-label="Edit Profile"
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                >
                  <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* Banner Main Content: Expanded Full-Width Title, Subtitle & Hero Image */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Title & Description */}
            <div className="flex flex-col gap-5 flex-1 max-w-3xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[90px] font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-lg">
                ASCEND<br />TASKS
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                Explore real-world industry problems, solve company bounties, and submit your solutions to earn <strong className="text-white font-extrabold">10-star</strong> evaluations and exclusive internship offers.
              </p>
            </div>

            {/* Right Side: Hero Rocket Graphic */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[450px] md:h-[450px] lg:w-[540px] lg:h-[540px] xl:w-[580px] xl:h-[580px] relative shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/ascend/rocket.png"
                alt="Rocket Launch"
                className="w-full h-full object-contain filter drop-shadow-[0_0_45px_rgba(255,255,255,0.35)]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              {/* Fallback Vector Rocket */}
              <div className="w-full h-full items-center justify-center hidden">
                <svg className="w-64 h-64 text-white" viewBox="0 0 200 200" fill="none">
                  <path d="M100 20 C115 50 120 90 120 120 L80 120 C80 90 85 50 100 20 Z" fill="white" />
                  <circle cx="100" cy="70" r="7" fill="#0c0c12" stroke="#000" strokeWidth="2" />
                  <path d="M80 100 L62 130 L80 122 Z" fill="white" />
                  <path d="M120 100 L138 130 L120 122 Z" fill="white" />
                </svg>
              </div>
            </div>

          </div>
        </div>

        {/* Sprint Timer Strip with Subtle Glow Animation (Hidden for now)
        <div className="w-full rounded-2xl bg-[#0c0c12] border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(16,185,129,0.08)] hover:shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-shadow duration-500 backdrop-blur-md animate-[ascendFadeUp_0.9s_ease-out_forwards]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400">
                5 DAY SPRINT COUNTDOWN
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Submit solutions before sprint deadline ends on August 18, 2026
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-4 sm:gap-6 text-emerald-400 font-black">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-mono">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">DAYS</span>
            </div>

            <span className="text-slate-600 font-bold text-2xl sm:text-3xl animate-pulse">:</span>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-mono">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">HRS</span>
            </div>

            <span className="text-slate-600 font-bold text-2xl sm:text-3xl animate-pulse">:</span>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-mono">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">MINS</span>
            </div>

            <span className="text-slate-600 font-bold text-2xl sm:text-3xl animate-pulse">:</span>

            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-mono">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">SECS</span>
            </div>
          </div>
        </div>
        */}

        {/* View Switching & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 animate-[ascendFadeUp_1.0s_ease-out_forwards]">
          {/* Main Tabs (AVAILABLE TASKS / MY SUBMISSIONS) */}
          <div className="flex items-center gap-8" role="tablist" aria-label="Tasks Navigation">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${
                activeTab === "tasks" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>AVAILABLE TASKS ({displayedTasks.length})</span>
              {activeTab === "tasks" && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full transition-all duration-300" />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "submissions"}
              onClick={() => setActiveTab("submissions")}
              className={`pb-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${
                activeTab === "submissions" ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>MY SUBMISSIONS ({validSubmissions.length})</span>
              {activeTab === "submissions" && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full transition-all duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Main Arena Layout: Left (Tasks Grid) & Right (Why Ascend? Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-[ascendFadeUp_1.1s_ease-out_forwards]">
          
          {/* Left Column: Tasks Grid (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {activeTab === "tasks" && (
              <>
                {loadingTasks ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                      Loading Ascend Bounties...
                    </span>
                  </div>
                ) : isSubmittedAfterDeadline ? (
                  <div className="py-12 px-6 sm:px-8 bg-[#0f090b]/90 border border-rose-500/20 rounded-2xl flex flex-col items-center justify-center gap-3.5 text-center shadow-[0_0_35px_rgba(244,63,94,0.08)] backdrop-blur-md">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center gap-1 max-w-lg">
                      <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest">
                        Task Submission Blocked
                      </h3>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed mt-0.5">
                        Your task wasn't uploaded as it's submitted after the deadline
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400/90 text-[11px] font-mono tracking-wide mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <span>Deadline: August 12, 2026</span>
                    </div>
                  </div>
                ) : !hasSubmittedInitial && isInitialDeadlinePassed ? (
                  <div className="py-12 px-6 sm:px-8 bg-[#0d0b07]/90 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-3.5 text-center shadow-[0_0_35px_rgba(245,158,11,0.08)] backdrop-blur-md">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center gap-1 max-w-lg">
                      <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest">
                        Initial Qualification Closed
                      </h3>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed mt-0.5">
                        The deadline or time for initial task is over. See you in the next season!
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-[11px] font-mono tracking-wide mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Deadline: August 12, 2026</span>
                    </div>
                  </div>
                ) : displayedTasks.length === 0 ? (
                  <div className="py-20 text-center bg-[#0c0c12] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 mb-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-white font-extrabold text-base">
                      {hasSubmittedInitial
                        ? "Initial Qualification Task Completed!"
                        : `No Active Bounties Available for ${userRegistration?.primary_domain || "your domain"}`}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mt-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {hasSubmittedInitial
                          ? "Next stage bounties will be out soon."
                          : "Initial qualification will be out at 1pm."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {displayedTasks.map((task) => {
                      const isSubmitted = submissions.some(
                        (s) => Number(s.task_id) === Number(task.id)
                      );
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          submitted={isSubmitted}
                          onSelectTask={(t) => setSelectedTaskForSubmission(t)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "submissions" && (
              <div className="flex flex-col gap-4">
                {validSubmissions.length === 0 ? (
                  <div className="py-20 text-center bg-[#0c0c12] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-white font-black text-lg">No Active Submissions under Evaluation</p>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Select an available bounty task, build your solution, and submit your deliverable URL.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {validSubmissions.map((sub) => (
                      <SubmissionCard
                        key={sub.id || sub.submitted_at}
                        submission={sub}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: "Why Ascend?" Sidebar Widget */}
          <div className="lg:col-span-1 p-6 sm:p-7 rounded-3xl bg-[#0c0c12] border border-white/10 flex flex-col gap-6 shadow-xl hover:border-white/20 transition-all duration-300">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M5 3v4a5 5 0 005 5h0a5 5 0 005-5V3M5 3H3v3a3 3 0 003 3h.2M19 3h2v3a3 3 0 01-3 3h-.2M12 12v4m-3 4h6" />
              </svg>
              <span>Why Ascend?</span>
            </h3>

            <div className="flex flex-col gap-5 divide-y divide-white/5">
              {/* Item 1 */}
              <div className="flex items-start gap-4 pt-1 group">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 group-hover:border-violet-500/40 group-hover:bg-violet-500/10 flex items-center justify-center text-white transition-all duration-300 shrink-0">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-violet-200 transition-colors">Solve real industry problems</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Work on challenges that matter.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-4 pt-5 group">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 flex items-center justify-center text-white transition-all duration-300 shrink-0">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-200 transition-colors">Earn 10-star evaluations</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Get rated by top engineers.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-4 pt-5 group">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 flex items-center justify-center text-white transition-all duration-300 shrink-0">
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-200 transition-colors">Unlock opportunities</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Stand out and get hired.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @keyframes ascendFadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ambientPulse {
          0% {
            transform: scale(0.9) translate(0, 0);
            opacity: 0.12;
          }
          50% {
            transform: scale(1.1) translate(20px, -20px);
            opacity: 0.18;
          }
          100% {
            transform: scale(0.95) translate(-15px, 15px);
            opacity: 0.12;
          }
        }
      `}</style>

      {/* Task Submission Modal */}
      {selectedTaskForSubmission && (
        <TaskSubmissionModal
          selectedTask={selectedTaskForSubmission}
          onClose={() => setSelectedTaskForSubmission(null)}
          onSuccess={refreshSubmissions}
        />
      )}

      {/* Registration / Edit Profile Modal */}
      {showRegModal && (
        <RegistrationModal
          existingRegistration={registered ? userRegistration : null}
          onClose={() => setShowRegModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </main>
  );
}
