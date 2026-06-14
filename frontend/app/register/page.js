"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import BackgroundVideo from "@/components/BackgroundVideo";
import { getBackendUrl } from "@/utils/api";

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];

const TEAM_FLAGS = {
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Portugal: "🇵🇹",
  Germany: "🇩🇪",
  France: "🇫🇷",
  England: "🇬🇧",
  Spain: "🇪🇸",
  Netherlands: "🇳🇱",
  Belgium: "🇧🇪",
  Croatia: "🇭🇷",
  Uruguay: "🇺🇾",
  Japan: "🇯🇵",
};

// WhatsApp invite link configuration per squad country
const TEAM_WHATSAPP_LINKS = {
  Brazil: "https://chat.whatsapp.com/EV8id4d16MGIXdmmpDtx7g",
  Argentina: "https://chat.whatsapp.com/BhddYg7jtG24SpEP9XmYvf",
  Portugal: "https://chat.whatsapp.com/Ec6u5gbzXaBLsKJOVdMSgB",
  Germany: "https://chat.whatsapp.com/KwNWCzEWyCJA24NmeacfLM",
  France: "https://chat.whatsapp.com/LY2EOqz9pXYClO7ZfIwybU",
  England: "https://chat.whatsapp.com/KnJcWM2Bb7M32TnT68LtUI",
  Spain: "https://chat.whatsapp.com/DAIaHMOjt3P6DrAdaD3EDv",
  Netherlands: "https://chat.whatsapp.com/BFLIlE9IdenBzj7R4zfGW9",
  Belgium: "https://chat.whatsapp.com/H8ibvdnnBSaLORa4gguG5M",
  Croatia: "https://chat.whatsapp.com/FkLUDYocKur6EWkSCSKNaN",
  Uruguay: "https://chat.whatsapp.com/DEYKZdZ65NG15zhIaxpAcK",
  Japan: "https://chat.whatsapp.com/Ccg1WGLaize3hgcVLUqZHF",
};

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
            : "border-white/10 focus:border-[#FF2E93]"
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
          className="absolute z-50 mt-1.5 w-full bg-[#080b15] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {options.map((option) => {
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
                    ? "text-[#FF2E93] bg-white/[0.03] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <span>{displayText}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-[#FF2E93]"
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

export default function RegisterPage() {
  // Form input states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    domain: "",
    team: "",
    consent: false,
  });

  // UI state management
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredData, setRegisteredData] = useState(null); // stores response object on success
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Client-side validations matching Zod rules
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear the specific validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
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
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          domain: formData.domain,
          team: formData.team,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRegisteredData(data.data);
      } else {
        // Handle server-side validation or conflict errors
        if (
          data.error &&
          data.error.code === "VALIDATION_ERROR" &&
          data.error.details
        ) {
          // Flatten standard array format if necessary
          const errors = {};
          Object.entries(data.error.details).forEach(([field, msgs]) => {
            errors[field] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          setValidationErrors(errors);
        } else if (data.error && data.error.code === "CONFLICT_ERROR") {
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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      domain: "",
      team: "",
      consent: false,
    });
    setValidationErrors({});
    setApiError("");
    setRegisteredData(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#04060d] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12">
      {/* Background Stadium Video */}
      <div className="no-print">
        <BackgroundVideo />
      </div>

      {/* Retro Theme Overlay and accent glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(20,10,35,0.2)_25%,#04060d_95%)] opacity-85 pointer-events-none no-print" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] pink-accent-glow pointer-events-none rounded-full opacity-55 no-print" />
      <div className="absolute bottom-[20%] left-[-15%] w-[45vw] h-[45vw] blue-accent-glow pointer-events-none rounded-full opacity-55 no-print" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full relative z-10 flex-1 flex flex-col justify-center items-center">
        {!registeredData ? (
          /* REGISTRATION FORM VIEW */
          <div className="w-full max-w-lg bg-glass-card rounded-2xl p-5 sm:p-6 md:p-8 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-5 sm:gap-6 bg-[linear-gradient(115deg,rgba(255,255,255,0.02),rgba(255,46,147,0.015))]">
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
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-3 px-4 rounded-xl font-medium flex items-center gap-2">
                <span className="text-base">⚠️</span> {apiError}
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
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FF2E93] transition-colors"
                />
                {validationErrors.name && (
                  <span
                    id="name-error"
                    className="text-[10px] text-red-400 font-semibold"
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
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FF2E93] transition-colors"
                />
                {validationErrors.email && (
                  <span
                    id="email-error"
                    className="text-[10px] text-red-400 font-semibold"
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
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FF2E93] transition-colors"
                />
                {validationErrors.phone && (
                  <span
                    id="phone-error"
                    className="text-[10px] text-red-400 font-semibold"
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
                      className="text-[10px] text-red-400 font-semibold"
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
                      formData.team
                        ? `${TEAM_FLAGS[formData.team]} ${formData.team}`
                        : ""
                    }
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, team: val }));
                      if (validationErrors.team) {
                        setValidationErrors((prev) => ({ ...prev, team: "" }));
                      }
                    }}
                    options={TEAMS}
                    optionRenderer={(team) => `${TEAM_FLAGS[team]} ${team}`}
                    placeholder="Select Team"
                    error={!!validationErrors.team}
                  />
                  {validationErrors.team && (
                    <span
                      id="team-error"
                      className="text-[10px] text-red-400 font-semibold"
                    >
                      {validationErrors.team}
                    </span>
                  )}
                </div>
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
                      className={`w-4 h-4 rounded-md border bg-black/40 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF2E93] ${
                        formData.consent
                          ? "border-[#FF2E93] bg-gradient-to-r from-pink-500/20 to-transparent"
                          : "border-white/10 group-hover:border-white/20"
                      }`}
                    >
                      {formData.consent && (
                        <svg
                          className="w-2.5 h-2.5 text-[#FF2E93]"
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
                  <span className="text-[10.5px] font-medium text-slate-300 leading-normal group-hover:text-white transition-colors text-left">
                    I accept the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPrivacyModalOpen(true);
                      }}
                      className="underline text-[#00E5FF] hover:text-[#FF2E93] cursor-pointer font-bold focus:outline-none"
                    >
                      Privacy Policy
                    </button>{" "}
                    and consent to share my data.
                  </span>
                </label>
                {validationErrors.consent && (
                  <span
                    id="consent-error"
                    className="text-[10px] text-red-400 font-semibold text-left"
                  >
                    {validationErrors.consent}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full cursor-pointer bg-glass border border-[#FF2E93]/40 hover:border-[#FF2E93]/90 text-[#FF2E93] hover:text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase glow-pink-btn bg-gradient-to-r from-pink-500/10 to-transparent flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[#FF2E93] border-t-transparent animate-spin" />
                    Transmitting...
                  </>
                ) : (
                  "ENTER THE ARENA"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* TOURNAMENT ENTRY PASS (TICKET) SUCCESS VIEW */
          <div className="w-full max-w-md flex flex-col gap-4 items-center px-4 sm:px-0">
            {/* Top Toolbar containing the print option on left top side */}
            <div className="w-full flex justify-between items-center no-print px-1">
              <button
                onClick={() => window.print()}
                className="cursor-pointer p-2.5 rounded-xl bg-glass border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                title="Print Pass"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.865 48.865 0 0 0-14.326 0C3.768 7.44 3 8.375 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M12 10.5h.008v.008H12V10.5Zm3 0h.008v.008H15V10.5ZM9 10.5h.008v.008H9V10.5ZM18 13.5h.008v.008H18V13.5ZM6 13.5h.008v.008H6V13.5M16.5 7.5v-3a3 3 0 0 0-3-3h-3a3 3 0 0 0-3 3v3m6 0h-6"
                  />
                </svg>
              </button>
            </div>

            {/* Ticket Card Container */}
            <div
              id="tournament-ticket"
              className="w-full bg-[#080b15]/90 border-2 border-dashed border-[#00E5FF]/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col gap-4 sm:gap-5 relative overflow-hidden backdrop-blur-lg select-none"
            >
              {/* Outer decorative card glows */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#00E5FF]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-[#FF2E93]/20 rounded-full blur-2xl pointer-events-none" />

              {/* Ticket Side Semi-circles for classic ticket punch design */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-[10px] w-5 h-5 bg-[#04060d] border-r-2 border-dashed border-[#00E5FF]/40 rounded-full" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-[10px] w-5 h-5 bg-[#04060d] border-l-2 border-dashed border-[#00E5FF]/40 rounded-full" />

              {/* Header Branding */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <Image
                      src="/trophy.png"
                      alt="World Cup Trophy"
                      width={9}
                      height={24}
                      priority
                      className="h-5 sm:h-6 w-auto object-contain filter drop-shadow-[0_0_6px_rgba(0,229,255,0.45)]"
                    />
                    <Image
                      src="/logo.png"
                      alt="μLearn Logo"
                      width={53}
                      height={24}
                      priority
                      className="h-5 sm:h-6 w-auto object-contain"
                    />
                  </div>
                  <div className="h-5 sm:h-6 w-[1px] bg-white/20 mx-0.5" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] sm:text-[11px] font-black tracking-wider text-slate-100 uppercase leading-tight mt-0.5">
                      Arena Access Pass
                    </span>
                  </div>
                </div>
                <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-1.5 sm:px-2 py-0.5 rounded text-[7px] sm:text-[8px] font-black text-[#00E5FF] tracking-wider uppercase shrink-0">
                  CONFIRMED
                </div>
              </div>

              {/* Ticket Meta Details */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 border-b border-white/5 pb-4">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Player Name
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {registeredData.name}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Player ID
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#00E5FF] truncate">
                    @{registeredData.user_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 border-b border-white/5 pb-4">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Selected Team
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {registeredData.team}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Squad Domain
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#FF2E93] truncate">
                    {registeredData.domain}
                  </span>
                </div>
              </div>

              {/* Footer / QR Simulation */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col text-left">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-600">
                    Issued On
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {new Date(
                      registeredData.created_at || Date.now(),
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-sm justify-center no-print mt-2">
              <a
                href={
                  TEAM_WHATSAPP_LINKS[registeredData.team] ||
                  "https://chat.whatsapp.com/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer bg-[#25D366] text-white hover:bg-[#20ba5a] px-6 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_35px_rgba(37,211,102,0.45)] transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.458L0 24zm6.59-4.846c1.66.986 3.284 1.48 4.961 1.481 5.41 0 9.809-4.385 9.811-9.78.001-2.592-1.01-5.033-2.85-6.877C16.726 2.133 14.29 1.13 11.75 1.13c-5.412 0-9.81 4.385-9.813 9.782-.001 1.77.462 3.5 1.341 5.024l-.993 3.626 3.762-.988zm11.521-7.82c-.29-.145-1.71-.845-1.975-.94-.266-.096-.46-.145-.652.146-.192.29-.74.94-.908 1.133-.167.193-.334.217-.624.072-2.905-1.45-4.103-2.5-5.748-5.323-.29-.497.29-.462.83-.984.096-.096.192-.217.29-.314.096-.096.13-.168.192-.29.06-.12.03-.229-.015-.314-.043-.086-.386-.94-.528-1.288-.138-.337-.278-.29-.386-.295-.098-.005-.213-.005-.33-.005a.633.633 0 0 0-.46.217c-.16.174-.608.596-.608 1.45s.62 1.69.708 1.81c.088.12 1.22 1.863 2.956 2.61.413.178.736.284.988.364.417.133.797.114 1.096.07.33-.05 1.71-.7 1.95-1.376.24-.678.24-1.259.17-1.376-.073-.117-.265-.164-.556-.31z" />
                </svg>
                <span>Join {registeredData.team} WhatsApp Group</span>
              </a>
            </div>

            <Link
              href="/leaderboard"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest font-black"
            >
              Return to Lobby
            </Link>
          </div>
        )}
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#080b15] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto bg-[linear-gradient(115deg,rgba(255,255,255,0.01),rgba(0,229,255,0.01))] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
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
            <div className="text-slate-300 text-[11px] leading-relaxed flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
                    className="underline text-[#00E5FF]"
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
                    className="underline text-[#00E5FF]"
                  >
                    info@mulearn.org
                  </a>
                  . We will respond to your request within 30 days.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-white/5">
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
                className="flex-1 cursor-pointer bg-glass border border-[#00E5FF]/40 hover:border-[#00E5FF]/90 text-[#00E5FF] hover:text-white font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase glow-blue-btn bg-gradient-to-r from-[#00E5FF]/10 to-transparent flex items-center justify-center transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
