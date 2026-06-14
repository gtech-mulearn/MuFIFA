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
  England: "EN",
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
  Croatia: "https://chat.whatsapp.com/CroatiaSquad2026",
  Uruguay: "https://chat.whatsapp.com/UruguaySquad2026",
  Japan: "https://chat.whatsapp.com/JapanSquad2026",
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
  });

  // UI state management
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredData, setRegisteredData] = useState(null); // stores response object on success

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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
                Register as an agent, select your squad domain, and choose your
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
                  Agent Full Name
                </label>
                <input
                  id="agent-name-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Adhwaith AS"
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
                  Indian Phone Number
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
                    Agent Name
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {registeredData.name}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                    Agent ID
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
    </div>
  );
}
