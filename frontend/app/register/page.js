"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import BackgroundVideo from "@/components/BackgroundVideo";
import BallLoader from "@/components/BallLoader";
import { getBackendUrl } from "@/utils/api";
import { DOMAINS, TEAM_FLAGS, DISPOSABLE_DOMAINS } from "@/utils/constants";

const TEAMS = Object.keys(TEAM_FLAGS);

function Select({
  value,
  onChange,
  options,
  optionRenderer,
  placeholder,
  error,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`bg-black/40 border rounded-xl px-4 py-2.5 text-xs text-slate-200 w-full flex items-center justify-between cursor-pointer focus:outline-none transition-colors ${
          error
            ? "border-red-500/50 focus:border-red-500"
            : "border-white/10 focus:border-[#4F46E5]"
        }`}
      >
        <span>{value || placeholder}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full bg-[#131927] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar py-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {options?.map((option) => {
            const isSelected = optionRenderer
              ? value === optionRenderer(option)
              : value === option;
            const displayText = optionRenderer
              ? optionRenderer(option)
              : option;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "text-[#4F46E5] bg-white/[0.03] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <span>{displayText}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-[#4F46E5]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams ? searchParams.get("ref") || "" : "";

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
    team: "",
    consent: false,
    referralId: refParam,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [otpModal, setOtpModal] = useState({
    open: false,
    email: "",
    otp: "",
    error: "",
    message: "",
    resendAvailableAt: 0,
    expiresAt: 0,
  });
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpCountdownMs, setOtpCountdownMs] = useState(0);

  // Check if player is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          router.push(`/dashboard`);
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isPrivacyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPrivacyModalOpen]);

  useEffect(() => {
    if (!otpModal.open) {
      setOtpCountdownMs(0);
      return;
    }

    const updateCountdown = () => {
      setOtpCountdownMs(Math.max(otpModal.resendAvailableAt - Date.now(), 0));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [otpModal.open, otpModal.resendAvailableAt]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    } else if (formData.email.includes("+")) {
      errors.email = "Plus addressing (using + symbols) is not allowed.";
    } else {
      const parts = formData.email.split("@");
      if (parts.length === 2) {
        const domain = parts[1].toLowerCase().trim();
        if (DISPOSABLE_DOMAINS.includes(domain)) {
          errors.email = "Temporary/disposable email addresses are not allowed.";
        }
      }
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      errors.phone = "Phone number is required.";
    } else if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Please enter a valid 10-digit Indian phone number.";
    }

    if (!formData.domain) {
      errors.domain = "Please select a domain.";
    }

    if (!formData.team) {
      errors.team = "Please select a FIFA team.";
    }

    if (!formData.consent) {
      errors.consent = "You must accept to share your data to register.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue =
      name === "referralId" && typeof value === "string"
        ? value.toUpperCase()
        : value;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : finalValue,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const applyApiErrors = (data) => {
    if (
      data.error &&
      data.error.code === "VALIDATION_ERROR" &&
      data.error.details
    ) {
      const errors = {};
      Object.entries(data.error.details).forEach(([field, msgs]) => {
        if (msgs) {
          errors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
      });
      setValidationErrors(errors);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(getBackendUrl("register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_otp",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          domain: formData.domain,
          team: formData.team,
          referralId: formData.referralId ? formData.referralId.trim() : "",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpModal({
          open: true,
          email: data.data.email,
          otp: "",
          error: "",
          message: data.message || "OTP sent to your email.",
          resendAvailableAt:
            Date.now() +
            (data.data.resendAvailableInMs !== undefined
              ? data.data.resendAvailableInMs
              : 120000),
          expiresAt:
            Date.now() +
            (data.data.expiresInMs !== undefined
              ? data.data.expiresInMs
              : 300000),
        });
      } else {
        if (applyApiErrors(data)) {
          return;
        }
        if (data.error && data.error.code === "CONFLICT_ERROR") {
          setApiError(data.error.message);
        } else {
          setApiError(
            data.error?.message ||
              "An unexpected error occurred. Please try again.",
          );
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
      setApiError(
        "Failed to communicate with the registration server. Ensure the backend is active.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (e) => {
    const nextOtp = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpModal((prev) => ({
      ...prev,
      otp: nextOtp,
      error: "",
    }));
  };

  const closeOtpModal = async () => {
    if (otpModal.email) {
      try {
        await fetch(getBackendUrl("register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel_otp",
            email: otpModal.email,
          }),
        });
      } catch (error) {
        console.error("Failed to cancel OTP session:", error);
      }
    }

    setOtpModal({
      open: false,
      email: "",
      otp: "",
      error: "",
      message: "",
      resendAvailableAt: 0,
      expiresAt: 0,
    });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otpModal.otp.length !== 6) {
      setOtpModal((prev) => ({
        ...prev,
        error: "Please enter the 6-digit OTP sent to your email.",
      }));
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch(getBackendUrl("register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          email: otpModal.email,
          otp: otpModal.otp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpModal({
          open: false,
          email: "",
          otp: "",
          error: "",
          message: "",
          resendAvailableAt: 0,
          expiresAt: 0,
        });
        // Store player in localStorage for instant rendering
        if (typeof window !== "undefined") {
          localStorage.setItem("player", JSON.stringify(data.data));
        }
        window.location.href = "/dashboard";
      } else {
        setOtpModal((prev) => ({
          ...prev,
          error:
            data.error?.message || "OTP verification failed. Please try again.",
        }));
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpModal((prev) => ({
        ...prev,
        error: "Could not verify OTP right now. Please try again.",
      }));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdownMs > 0) {
      return;
    }

    setIsResendingOtp(true);

    try {
      const res = await fetch(getBackendUrl("register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_otp",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          domain: formData.domain,
          team: formData.team,
          referralId: formData.referralId ? formData.referralId.trim() : "",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpModal((prev) => ({
          ...prev,
          otp: "",
          error: "",
          message: data.message || "A new OTP has been sent to your email.",
          resendAvailableAt:
            Date.now() +
            (data.data.resendAvailableInMs !== undefined
              ? data.data.resendAvailableInMs
              : 120000),
          expiresAt:
            Date.now() +
            (data.data.expiresInMs !== undefined
              ? data.data.expiresInMs
              : 300000),
        }));
      } else {
        setOtpModal((prev) => ({
          ...prev,
          error:
            data.error?.message ||
            "Could not resend OTP right now. Please try again.",
        }));
      }
    } catch (error) {
      console.error("OTP resend error:", error);
      setOtpModal((prev) => ({
        ...prev,
        error: "Could not resend OTP right now. Please try again.",
      }));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      domain: "",
      team: "",
      consent: false,
      referralId: refParam,
    });
    setValidationErrors({});
    setApiError("");
    setOtpModal({
      open: false,
      email: "",
      otp: "",
      error: "",
      message: "",
      resendAvailableAt: 0,
      expiresAt: 0,
    });
  };

  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12 ">
      {/* Background Stadium Video */}
      <div className="no-print">
        <BackgroundVideo />
      </div>

      {/* Retro Theme Overlay and accent glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_25%,#090A0F_95%)] opacity-85 pointer-events-none no-print" />
      <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] indigo-accent-glow pointer-events-none rounded-full opacity-20 no-print" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45vw] h-[45vw] cyan-accent-glow pointer-events-none rounded-full opacity-20 no-print" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center">
        {/* REGISTRATION FORM VIEW */}
        <div className="w-full max-w-lg bg-glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-5 sm:gap-6 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(79, 70, 229,0.015))]">
          {/* Header */}
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
              Arena Registration
            </h1>
            <p className="text-xs text-slate-400">
              Register as an player, select your squad domain, and choose your
              team.
            </p>
          </div>

          {apiError && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs py-3 px-4 rounded-xl font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-indigo-400 shrink-0"
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
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="agent-name-input"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Player Full Name
              </label>
              <input
                id="agent-name-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Your Full Name"
                aria-invalid={!!validationErrors.name}
                aria-describedby={
                  validationErrors.name ? "name-error" : undefined
                }
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
              {validationErrors.name && (
                <span
                  id="name-error"
                  className="text-[10px] text-indigo-400 font-semibold"
                >
                  {validationErrors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="agent-email-input"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Email Address
              </label>
              <input
                id="agent-email-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. mulearn@gmail.com"
                aria-invalid={!!validationErrors.email}
                aria-describedby={
                  validationErrors.email ? "email-error" : undefined
                }
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
              {validationErrors.email && (
                <span
                  id="email-error"
                  className="text-[10px] text-indigo-400 font-semibold"
                >
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="agent-phone-input"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Phone Number
              </label>
              <input
                id="agent-phone-input"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 1234567890"
                aria-invalid={!!validationErrors.phone}
                aria-describedby={
                  validationErrors.phone ? "phone-error" : undefined
                }
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors"
              />
              {validationErrors.phone && (
                <span
                  id="phone-error"
                  className="text-[10px] text-indigo-400 font-semibold"
                >
                  {validationErrors.phone}
                </span>
              )}
            </div>

            {/* Domain & FIFA Team Selector Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Domain Select */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="domain-select-btn"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-300"
                >
                  Squad Domain
                </label>
                <Select
                  id="domain-select-btn"
                  value={formData.domain}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, domain: val }));
                    if (validationErrors.domain) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        domain: "",
                      }));
                    }
                  }}
                  options={DOMAINS}
                  placeholder="Select Domain"
                  error={!!validationErrors.domain}
                />
                {validationErrors.domain && (
                  <span
                    id="domain-error"
                    className="text-[10px] text-indigo-400 font-semibold"
                  >
                    {validationErrors.domain}
                  </span>
                )}
              </div>

              {/* Team Select */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="team-select-btn"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-300"
                >
                  FIFA Country Team
                </label>
                <Select
                  id="team-select-btn"
                  value={
                    formData.team ? (
                      <span className="flex items-center gap-2">
                        <span
                          className={`fi fi-${TEAM_FLAGS[formData.team]} rounded-sm shadow-sm border border-white/10 shrink-0`}
                          style={{ width: "16px", height: "12px" }}
                          aria-hidden="true"
                        />
                        <span>{formData.team}</span>
                      </span>
                    ) : (
                      ""
                    )
                  }
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, team: val }));
                    if (validationErrors.team) {
                      setValidationErrors((prev) => ({ ...prev, team: "" }));
                    }
                  }}
                  optionRenderer={(team) => (
                    <span className="flex items-center gap-2">
                      <span
                        className={`fi fi-${TEAM_FLAGS[team]} rounded-sm shadow-sm border border-white/10 shrink-0`}
                        style={{ width: "16px", height: "12px" }}
                        aria-hidden="true"
                      />
                      <span>{team}</span>
                    </span>
                  )}
                  placeholder="Select Team"
                  options={TEAMS}
                  error={!!validationErrors.team}
                />
                {validationErrors.team && (
                  <span
                    id="team-error"
                    className="text-[10px] text-indigo-400 font-semibold"
                  >
                    {validationErrors.team}
                  </span>
                )}
              </div>
            </div>

            {/* Referral ID Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="referral-id-input"
                className="text-[10px] font-black uppercase tracking-wider text-slate-300"
              >
                Referral ID (Optional)
              </label>
              <input
                id="referral-id-input"
                type="text"
                name="referralId"
                value={formData.referralId}
                onChange={handleInputChange}
                placeholder={refParam ? refParam : "e.g. H8F9X2"}
                disabled={!!refParam}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {refParam && (
                <span className="text-[9.5px] text-[#06B6D4] font-medium text-left">
                  ✓ Referral applied.
                </span>
              )}
            </div>

            {/* Data Consent Checkbox */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleInputChange}
                    className="sr-only peer"
                    aria-invalid={!!validationErrors.consent}
                    aria-describedby={
                      validationErrors.consent ? "consent-error" : undefined
                    }
                  />
                  {/* Visual Checkbox */}
                  <div
                    className={`w-4.5 h-4.5 rounded-md border bg-black flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#06B6D4] ${
                      formData.consent
                        ? "border-[#06B6D4] bg-gradient-to-r from-[#06B6D4]/30 to-[#4F46E5]/20"
                        : "border-slate-400 group-hover:border-[#06B6D4]"
                    }`}
                  >
                    {formData.consent && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[12px] font-medium text-slate-300 leading-normal group-hover:text-white transition-colors text-left">
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPrivacyModalOpen(true);
                    }}
                    className="underline text-[#06B6D4] hover:text-[#4F46E5] cursor-pointer font-bold focus:outline-none"
                  >
                    Privacy Policy
                  </button>{" "}
                  and consent to share my data.
                </span>
              </label>
              {validationErrors.consent && (
                <span
                  id="consent-error"
                  className="text-[10px] text-indigo-400 font-semibold text-left"
                >
                  {validationErrors.consent}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full cursor-pointer bg-white border border-white hover:bg-white/90 text-black font-bold py-3 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Submitting...
                </>
              ) : (
                "ENTER THE ARENA"
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 mt-2">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-[#06B6D4] hover:text-[#4F46E5] font-bold underline transition-colors cursor-pointer"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
          <div className="relative w-full max-w-lg bg-[#131927] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left h-auto max-h-[85vh] bg-[linear-gradient(115deg,rgba(255,255,255,0.01),rgba(6, 182, 212,0.01))] animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-sm focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Policy Content */}
            <div className="text-slate-300 text-[11px] leading-relaxed flex flex-col gap-4 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin break-words">
              <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Last Updated: September 2025
                </span>
              </div>
              <p>
                This Policy is issued by µLearn, which includes its parent,
                subsidiaries and affiliates (together, &quot;µLearn&quot;, or
                &quot;We&quot; or &quot;us&quot; or &quot;our(s)&quot;) and is
                addressed to individuals outside our organisation with whom we
                interact, including but not limited to customers, visitors to
                our websites, offices and other users (together,
                &quot;You&quot;) of our Services. By registering to µLearn
                platform, you are implicitly consenting to have your profile
                registered for e-learning, reporting purposes and helping µLearn
                improve the research quality.
              </p>
              <p>
                You are hereby agreed that the data you are freely deciding to
                share is intended to keep your profile up to date and complete.
                This data will be processed in order to manage our e-learning
                process and offer you more visibility and accessibility to
                opportunities which will match with your profile.
              </p>
              <p>
                You agree that while creating a profile, it implies a transfer
                of your profile data to µLearn entities located across Kerala.
                The protection of your data is assured by our internal
                Information Security, and is processed with your consent and for
                the legitimate interest of µLearn Group.
              </p>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  1. Use of Information
                </span>
                <p className="mb-2">
                  We use your information to provide, analyse, administer,
                  enhance and personalize our Services and marketing efforts, to
                  process your registration, and to communicate with you on
                  these and other topics.
                </p>
                <p className="mb-2">
                  We use your information in order to resolve disputes;
                  troubleshoot problems; help promote safe matching; measure
                  consumer interest in Services; inform you about Offers,
                  Products, Services, and Updates; customize your experience;
                  detect and protect us against error, fraud and other criminal
                  activity; enforce our Terms of Services (TOS); and as
                  otherwise described to you at the time of registration. We may
                  compare and review your Information for errors, omissions and
                  for accuracy.
                </p>
                <p className="mb-2">
                  We use your e-mail to send you system e-mails about the
                  functionality of our Website.
                </p>
                <p className="mb-2">
                  We use your e-mail associated with your account in order to
                  send you newsletters and promotions in conjunction with your
                  use of our Services.
                </p>
                <p className="mb-2">
                  We may use your Information in order to provide benchmark
                  analysis and aggregate statistics. This particular Information
                  will be anonymized, will not contain personal identification
                  and will not be transferred or sold to third parties in any
                  way or format that identifies you.
                </p>
                <p className="mb-2">
                  We use Website navigation data to operate and improve our
                  Website. We may also use Website navigation data alone or in
                  combination with your Information to provide aggregated
                  information about µLearn.
                </p>
                <p className="mb-2">
                  We collect the IP Addresses to track when you use our Website.
                  We use IP Addresses to monitor the regions from which you
                  navigate our Website and sign-up to use our Services. Your IP
                  Address is also registered for statistical purposes and to
                  better our advertising and layout of the Website.
                </p>
                <p>
                  We do not transfer, sell or rent your Information to third
                  parties for their marketing purposes other than what is stated
                  in this Privacy Policy. We request only the information that
                  we need to operate our Services and improve our Website&apos;s
                  user experience. We do not use your Information to create any
                  advertising creative.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  2. Protection of Information
                </span>
                <p className="mb-2">
                  We use reasonable administrative, logical, physical and
                  managerial measures to safeguard your personal information
                  against loss, theft and unauthorised access, use and
                  modification. These measures are designed to provide a level
                  of security appropriate to the risks of processing your
                  personal information.
                </p>
                <p className="mb-2">
                  All our employees, independent contractors and agents have
                  executed non-disclosure agreements, which provide explicit
                  confidentiality protections.
                </p>
                <p className="mb-2">
                  We do not make any of your Information available to third
                  parties for their marketing purposes. µLearn&apos;s software
                  may runs on individual servers and no data given or collected
                  is shared with other social media platforms.
                </p>
                <p className="mb-2">
                  We use robust security measures to protect data from
                  unauthorized access, maintain data accuracy, and help ensure
                  the appropriate use of data. When the Services are accessed
                  using the internet, Secure Socket Layer (SSL) technology
                  protects your Information, using both server authentication
                  and data encryption. These technologies help ensure that your
                  Information is safe, secure, and only available to you and to
                  whom you have granted access.
                </p>
                <p>
                  µLearn does its utmost to secure communications and data
                  storage in order to protect confidentiality of your
                  Information against loss and interception by third parties.
                  However, it is important to know that there is no zero-risk
                  element against loss or interception by others of your
                  Information.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  3. Storage of Information
                </span>
                <p className="mb-2">
                  We save your Information in our database in order to improve
                  our Website and user experience and in accordance with our
                  TOS. If you wish that your Information be permanently deleted
                  from our database when you stop using our Services, please
                  notify us at info@mulearn.org
                </p>
                <p className="mb-2">
                  µLearn is an Indian company. If you are located outside India
                  and choose to provide information to us, µLearn transfers your
                  Information to our servers in India. India may not have the
                  same data protection laws as the country in which you
                  initially provided the Information. Therefore while we
                  transfer your Information to India, we will protect it as
                  described in this Privacy Policy.
                </p>
                <p>
                  By visiting our Website or providing µLearn with your
                  Information, you fully understand and unambiguously consent to
                  this transfer, processing and storage of your Information in
                  India.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  4. Data Retention
                </span>
                <p>
                  We retain your Personal Data for as long as is required to
                  fulfil the activities set out in this Privacy Policy, for as
                  long as otherwise communicated to you or for as long as is
                  permitted by Applicable Law.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  5. Your legal rights
                </span>
                <p>
                  Under Applicable Law, you may have a number of rights,
                  including: the right not to provide your Personal Data to us;
                  the right of access to your Personal Data; the right to
                  request rectification of inaccuracies; the right to request
                  the erasure, or restriction of Processing, of your Personal
                  Data; the right to object to the Processing of your Personal
                  Data; the right to have your Personal Data transferred to
                  another Controller; the right to withdraw consent; and the
                  right to lodge complaints with Data Protection Authorities. We
                  may require proof of your identity before we can give effect
                  to these rights.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  6. Other websites
                </span>
                <p>
                  µLearn&apos;s Website may contain links to sites operated by
                  third parties whose policies regarding the handling of
                  information may differ from ours. These websites and platforms
                  have separate and independent privacy or data policies,
                  privacy statements, notices and terms of use, which we
                  recommend you read carefully. In addition, you may encounter
                  third party applications that interact with µLearn&apos;s
                  Services.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  7. Applicable Law
                </span>
                <p>
                  The validity and interpretation of this Privacy Policy shall
                  be governed by the laws of the India.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  8. Changes to this Privacy Policy
                </span>
                <p>
                  This Policy may be amended or updated from time to time to
                  reflect changes in our practices with respect to the
                  Processing of Personal Data, or changes in Applicable Law. We
                  encourage you to read this Policy carefully, and to regularly
                  check this page to review any changes we might make in
                  accordance with the terms of this Policy.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  9. Cookies and Tracking Technologies
                </span>
                <p className="mb-2">
                  We use cookies and similar tracking technologies to enhance
                  your browsing experience, analyze website traffic, and
                  personalize content. Cookies are small text files stored on
                  your device that help us remember your preferences and
                  understand how you interact with our website.
                </p>
                <p className="mb-1">
                  <strong>Essential Cookies:</strong> These cookies are
                  necessary for the website to function properly. They enable
                  core functionality such as security, network management, and
                  accessibility. You cannot opt out of essential cookies.
                </p>
                <p className="mb-1">
                  <strong>Analytics Cookies:</strong> We use Google Analytics 4
                  to collect anonymous information about how visitors use our
                  website. This data helps us improve user experience and
                  website performance. Analytics cookies are only activated with
                  your consent.
                </p>
                <p className="mb-1">
                  <strong>Performance Cookies:</strong> These cookies collect
                  information about page load times and Core Web Vitals metrics
                  to help us optimize website performance.
                </p>
                <p>
                  <strong>Marketing Cookies:</strong> These cookies may be used
                  to deliver personalized advertisements and measure the
                  effectiveness of marketing campaigns. Marketing cookies
                  require explicit consent.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  10. Google Analytics
                </span>
                <p className="mb-2">
                  We use Google Analytics 4, a web analytics service provided by
                  Google LLC, to analyze website usage. Google Analytics uses
                  cookies to collect anonymous data including pages visited,
                  time spent on pages, referral sources, and device information.
                  This data is processed by Google and may be transferred to
                  servers in the United States.
                </p>
                <p className="mb-2">
                  We have implemented IP anonymization to ensure your full IP
                  address is never stored.
                </p>
                <p className="mb-2">
                  We do not combine Google Analytics data with personally
                  identifiable information.
                </p>
                <p className="mb-2">
                  You can opt out of Google Analytics by using our cookie
                  preferences panel or by installing the Google Analytics
                  Opt-out Browser Add-on.
                </p>
                <p>
                  For more information about Google&apos;s privacy practices,
                  please visit:{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#06B6D4] break-all"
                  >
                    https://policies.google.com/privacy
                  </a>
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  11. Your Cookie Choices
                </span>
                <p className="mb-2">
                  You have the right to manage your cookie preferences at any
                  time. When you first visit our website, a cookie consent
                  banner will appear asking for your consent to use
                  non-essential cookies. You can:
                </p>
                <p className="mb-2">
                  <strong>Accept All:</strong> Enable all cookies including
                  analytics, performance, and marketing cookies.
                </p>
                <p className="mb-2">
                  <strong>Reject All:</strong> Only essential cookies will be
                  used, which are necessary for website functionality.
                </p>
                <p className="mb-2">
                  <strong>Manage Preferences:</strong> Customize which cookie
                  categories you allow. You can change your preferences at any
                  time through the &apos;Cookie Settings&apos; link in our
                  website footer.
                </p>
                <p>
                  Most web browsers allow you to control cookies through their
                  settings. However, limiting cookies may affect your experience
                  on our website.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  12. Do Not Track
                </span>
                <p>
                  We respect the Do Not Track (DNT) browser setting. If you have
                  enabled DNT in your browser, we will honor this signal and
                  limit tracking accordingly. Please note that enabling DNT may
                  affect some website functionality.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">
                  13. International Data Transfers and Your Rights
                </span>
                <p className="mb-2">
                  If you are located in the European Union, California, or
                  Brazil, you have specific rights regarding your personal data
                  under GDPR, CCPA, and LGPD respectively:
                </p>
                <p className="mb-1">
                  <strong>Right to Access:</strong> You can request a copy of
                  your personal data we hold.
                </p>
                <p className="mb-1">
                  <strong>Right to Rectification:</strong> You can request
                  correction of inaccurate personal data.
                </p>
                <p className="mb-1">
                  <strong>Right to Erasure:</strong> You can request deletion of
                  your personal data under certain circumstances.
                </p>
                <p className="mb-1">
                  <strong>Right to Data Portability:</strong> You can request
                  your data in a machine-readable format.
                </p>
                <p className="mb-1">
                  <strong>Right to Object:</strong> You can object to processing
                  of your personal data for marketing purposes.
                </p>
                <p className="mb-2">
                  <strong>Right to Withdraw Consent:</strong> You can withdraw
                  your consent for data processing at any time by updating your
                  cookie preferences.
                </p>
                <p>
                  To exercise any of these rights, please contact us at{" "}
                  <a
                    href="mailto:info@mulearn.org"
                    className="underline text-[#06B6D4]"
                  >
                    info@mulearn.org
                  </a>
                  . We will respond to your request within 30 days.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, consent: true }));
                  if (validationErrors.consent) {
                    setValidationErrors((prev) => ({ ...prev, consent: "" }));
                  }
                  setIsPrivacyModalOpen(false);
                }}
                className="flex-1 cursor-pointer bg-glass border border-[#06B6D4]/40 hover:border-[#06B6D4]/90 text-[#06B6D4] hover:text-white font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase glow-cyan-btn bg-gradient-to-r from-[#06B6D4]/10 to-transparent flex items-center justify-center transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {otpModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#131927] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-extrabold tracking-wider text-white uppercase">
                Verify OTP
              </h2>
              <p className="text-xs text-slate-400">
                We sent a 6-digit OTP to{" "}
                <span className="text-slate-200">{otpModal.email}</span>. Please
                check your inbox and{" "}
                <span className="text-slate-200 font-bold">
                  spam/junk folder
                </span>
                . Your registration will be saved only after successful
                verification.
              </p>
            </div>

            {otpModal.message && (
              <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] text-xs py-2.5 px-3 rounded-xl">
                {otpModal.message}
              </div>
            )}

            {otpModal.error && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs py-2.5 px-3 rounded-xl">
                {otpModal.error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="otp-input"
                  className="text-[10px] font-black uppercase tracking-wider text-slate-300"
                >
                  One-Time Password
                </label>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpModal.otp}
                  onChange={handleOtpChange}
                  placeholder="Enter 6-digit OTP"
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm tracking-[0.4em] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#4F46E5] transition-colors text-center"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Valid for 5 minutes</span>
                  <span>
                    {otpCountdownMs > 0
                      ? `Resend in ${formatCountdown(otpCountdownMs)}`
                      : "You can resend OTP now"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpCountdownMs > 0 || isResendingOtp}
                  className="cursor-pointer bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4] disabled:opacity-40 disabled:cursor-not-allowed font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition-colors"
                >
                  {isResendingOtp ? "Sending" : "Resend"}
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="cursor-pointer bg-white border border-white hover:bg-white/90 text-black font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
                >
                  {isVerifyingOtp ? "Verifying" : "Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isVerifyingOtp && <BallLoader fullScreen={true} />}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#090A0F] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
