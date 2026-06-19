"use client";

import React, { useEffect, useRef, useState } from "react";
import "./PlayerCard.css";

/**
 * Mapping of team names to their flag background image paths.
 * The /playerCard/flag/ directory contains large stadium+flag photos per team.
 */
const TEAM_FLAG_BG = {
  Argentina: "/playerCard/flag/argentina.jpeg",
  Brazil: "/playerCard/flag/brazil.jpeg",
  England: "/playerCard/flag/england.jpeg",
  Japan: "/playerCard/flag/japan.jpeg",
  Portugal: "/playerCard/flag/portugal.jpeg",
  Netherlands: "/playerCard/flag/netherlands.png",
  Belgium: "/playerCard/flag/belgium.jpeg",
  Spain: "/playerCard/flag/spain.jpeg",
  Uruguay: "/playerCard/flag/uruguay.jpeg",
  Germany: "/playerCard/flag/germany.jpeg",
  France: "/playerCard/flag/france.jpeg",
  Croatia: "/playerCard/flag/croatia.jpeg",
};

/**
 * Country codes for flag-icons
 */
const TEAM_COUNTRY_CODES = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

/**
 * Domain to position-label mapping
 */
const DOMAIN_POSITIONS = {
  Coder: "Technical Striker",
  Creative: "Creative Playmaker",
  Strategist: "Strategic Captain",
  Maker: "Tactical Builder",
};

/**
 * Domain to stat icon mapping using badge images
 * IMG_2349 = palette (Creativity)
 * IMG_2350 = diamond/tag (Branding)
 * IMG_2351 = lightbulb (Innovation)
 * IMG_2352 = people group (Teamwork)
 * IMG_2353 = target (Execution)
 * IMG_2355 = star hexagon badge
 * IMG_2357 = pencil hexagon badge
 * people  = people badge
 */
const STAT_ICONS = {
  creativity: "/playerCard/badge/Object-6.png",
  branding: "/playerCard/badge/Object-5.png",
  innovation: "/playerCard/badge/Object-4.png",
  teamwork: "/playerCard/badge/Object-3.png",
  execution: "/playerCard/badge/Object-7.png",
};

const ACHIEVEMENT_ICONS = {
  star: "/playerCard/badge/Object-2.png",
  pencil: "/playerCard/badge/Object-1.png",
  people: "/playerCard/badge/Object.png",
};

/**
 * Generate pseudo-random stats from a player's mu_points and name.
 * This creates consistent stats for the same player.
 */
function generateStats(muPoints = 0, name = "", xpBreakdown = null) {
  if (xpBreakdown) {
    const base = 50;
    return {
      creativity: Math.min(99, base + (xpBreakdown.creativity || 0)),
      branding: Math.min(99, base + (xpBreakdown.branding || 0)),
      innovation: Math.min(99, base + (xpBreakdown.innovation || 0)),
      teamwork: Math.min(99, base + (xpBreakdown.teamwork || 0)),
      execution: Math.min(99, base + (xpBreakdown.execution || 0)),
    };
  }

  const seed = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = Math.min(Math.max(Math.floor(muPoints / 10 + 50), 40), 95);

  return {
    creativity: Math.min(99, base + ((seed * 3) % 12)),
    branding: Math.min(99, base - 2 + ((seed * 7) % 10)),
    innovation: Math.min(99, base - 4 + ((seed * 5) % 11)),
    teamwork: Math.min(99, base - 6 + ((seed * 11) % 9)),
    execution: Math.min(99, base - 8 + ((seed * 13) % 13)),
  };
}

/**
 * Calculate OVR (Overall Rating) from stats
 */
function calculateOVR(stats) {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * PlayerCard Component
 *
 * Props:
 * - player: { name, user_id, team, domain, mu_points, avatar_url, college? }
 * - goals, assists, challenges: number stats
 * - achievements: array of { icon, label }
 * - specialization: { title, description }
 */
export default function PlayerCard({
  player = {},
  goals = null,
  assists = null,
  challenges = null,
  achievements = null,
  specialization = null,
}) {
  const statsRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  // Default data structure
  const data = {
    name: player.name || "",
    user_id: player.user_id || "",
    team: player.team || "",
    domain: player.domain || "",
    mu_points: player.mu_points || 0,
    avatar_url: player.avatar_url || null,
    college: player.institution || player.college || "",
  };

  const stats = generateStats(data.mu_points, data.name, player.xp_breakdown);
  const ovr = calculateOVR(stats);

  // Get referral count from player tasks
  let referralCount = 0;
  if (player && player.tasks) {
    if (typeof player.tasks === "object") {
      referralCount = player.tasks.referal || 0;
    } else if (typeof player.tasks === "string") {
      try {
        const parsed = JSON.parse(player.tasks);
        referralCount = parsed.referal || 0;
      } catch (e) {
        console.error("Failed to parse player tasks JSON string:", e);
      }
    }
  }

  const playerGoals = goals ?? Math.floor(data.mu_points / 7);
  const playerAssists = assists ?? referralCount;
  const playerChallenges = challenges ?? Math.floor(data.mu_points / 105);

  const playerPosition = DOMAIN_POSITIONS[data.domain] || "";

  const defaultAchievements = achievements || [
    { icon: ACHIEVEMENT_ICONS.star, label: "Design Sprint Finisher" },
    { icon: ACHIEVEMENT_ICONS.people, label: "Community Contributor" },
    { icon: ACHIEVEMENT_ICONS.pencil, label: "Creative Challenge Participant" },
  ];

  const defaultSpec = specialization || {
    title: data.domain || "",
    description: player.bio ? `"${player.bio}"` : "",
  };

  // Animate stat bars on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
        }
      },
      { threshold: 0.3 },
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [animated]);

  // Set profile URL client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileUrl(`${window.location.origin}/profile/${data.user_id}`);
    }
  }, [data.user_id]);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const flagBg = TEAM_FLAG_BG[data.team];
  const countryCode = TEAM_COUNTRY_CODES[data.team];

  return (
    <div className="player-card-wrapper">
      <div className="player-card">
        {/* Shiny gold borders & lighting patterns */}
        <div className="pc-card-inner-border" />
        {flagBg && (
          <div
            className="pc-flag-bg"
            style={{ backgroundImage: `url(${flagBg})` }}
          />
        )}
        <div className="pc-bg-lines" />
        <div className="pc-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="pc-particle" />
          ))}
        </div>

        {/* Header Section */}
        <div className="pc-header">
          <img
            src="/trophy.webp"
            className="pc-header-trophy-left"
            alt="Trophy"
          />
          <div className="pc-header-title">
            <div className="pc-header-mu">
              <span className="pc-blue-mu">μ</span>FIFA WORLD CUP
            </div>
            <div className="pc-header-year">★ 2026 ★</div>
          </div>
          <img
            src="/Logos/logo.png"
            alt="logo"
            className="pc-header-shield-logo"
          />
        </div>

        {/* Team Banner */}
        <div className="pc-team-banner">
          <div className="pc-team-left">
            <div className="pc-team-flag-container">
              {countryCode ? (
                <div
                  className="pc-team-flag-icon"
                  style={{
                    backgroundImage: `url(https://flagcdn.com/w80/${countryCode}.png)`,
                  }}
                  role="img"
                  aria-label={`${data.team} flag`}
                />
              ) : (
                <svg
                  className="w-5 h-5 text-slate-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              )}
            </div>
            <div className="pc-team-info">
              <div className="pc-team-name">{data.team}</div>
              <div className="pc-team-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="pc-team-star">
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="pc-ovr-block">
            <span className="pc-ovr-label">OVR</span>
            <span className="pc-ovr-value">{ovr}</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="pc-main-layout">
          {/* Photo Section (Left Column) */}
          <div className="pc-photo-section">
            <div className="pc-player-photo">
              <div className="pc-avatar-frame">
                {data.avatar_url ? (
                  <div
                    className="pc-avatar-img"
                    style={{ backgroundImage: `url(${data.avatar_url})` }}
                    aria-label={data.name}
                    role="img"
                  />
                ) : (
                  <div className="pc-avatar-placeholder-initials">
                    {getInitials(data.name)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info & Stats Section (Right Column) */}
          <div className="pc-info-section">
            <div className="pc-player-name">{data.name}</div>

            <div className="pc-player-college">{data.college}</div>

            {/* Position Block with Neon Silhouette */}
            <div className="pc-position-container pc-position-locked">
              <div className="pc-position-block">
                <span className="pc-position-label">POSITION</span>
                <span className="pc-position-value pc-position-blurred">
                  {playerPosition}
                </span>
              </div>
              <div className="pc-position-lock-overlay">
                <svg viewBox="0 0 24 24" className="pc-position-lock-icon">
                  <path
                    fill="currentColor"
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                  />
                </svg>
              </div>
              <div className="pc-position-silhouette-wrapper">
                <svg
                  viewBox="0 0 100 100"
                  className="pc-position-silhouette"
                  fill="none"
                  stroke="rgba(0, 210, 255, 0.7)"
                  strokeWidth="3"
                >
                  <path
                    d="M 50 25 C 50 22.238 52.238 20 55 20 C 57.762 20 60 22.238 60 25 C 60 27.762 57.762 30 55 30 C 52.238 30 50 27.762 50 25 Z"
                    fill="rgba(0, 210, 255, 0.7)"
                  />
                  <path
                    d="M 35 45 L 48 35 L 58 40 L 72 32 M 48 35 L 42 58 L 30 75 M 48 50 L 58 65 L 75 62 L 85 75 M 58 40 L 68 55"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="88" cy="78" r="4" fill="rgba(0, 210, 255, 0.9)" />
                </svg>
              </div>
            </div>

            {/* Stats Bars List */}
            <div className="pc-stats" ref={statsRef}>
              {Object.entries(stats).map(([key, value]) => (
                <div className="pc-stat-row" key={key}>
                  <img
                    src={STAT_ICONS[key]}
                    alt={key}
                    className="pc-stat-icon"
                  />
                  <span className="pc-stat-label">{key}</span>
                  <div className="pc-stat-bar-container">
                    <div
                      className="pc-stat-bar-fill"
                      style={{ width: animated ? `${value}%` : "0%" }}
                    />
                  </div>
                  <span className="pc-stat-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Stats: Goals, Assists, Challenges */}
        <div className="pc-bottom-stats">
          <div className="pc-bottom-stat pc-stat-locked">
            <img
              src="/playerCard/football.webp"
              alt="Goals"
              className="pc-bottom-stat-icon"
            />
            <div className="pc-bottom-stat-info">
              <span className="pc-bottom-stat-label">GOALS</span>
              <span className="pc-bottom-stat-value">
                <svg viewBox="0 0 24 24" className="pc-bottom-stat-lock-icon">
                  <path
                    fill="currentColor"
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="pc-bottom-stat-divider" />
          <div className="pc-bottom-stat">
            <svg
              viewBox="0 0 64 64"
              className="pc-bottom-stat-icon-svg"
              fill="url(#goldGrad)"
            >
              <defs>
                <linearGradient
                  id="goldGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f7d070" />
                  <stop offset="50%" stopColor="#c5a03e" />
                  <stop offset="100%" stopColor="#8c6a1c" />
                </linearGradient>
              </defs>
              <path d="M12 44c0 0 10-6 16-6s12-1 18 5c4 4 6 1 8-3s-2-12-6-14-12 1-18-2-10-6-16-4c-6 2-10 10-10 14s2 10 8 10z" />
              <path d="M36 22l-4 8 8 2 2-8z" />
              <rect
                x="18"
                y="45"
                width="4"
                height="4"
                rx="1"
                transform="rotate(10 18 45)"
              />
              <rect
                x="28"
                y="45"
                width="4"
                height="4"
                rx="1"
                transform="rotate(10 28 45)"
              />
              <rect
                x="38"
                y="46"
                width="4"
                height="4"
                rx="1"
                transform="rotate(10 38 46)"
              />
              <rect
                x="48"
                y="47"
                width="4"
                height="4"
                rx="1"
                transform="rotate(10 48 47)"
              />
            </svg>
            <div className="pc-bottom-stat-info">
              <span className="pc-bottom-stat-label">ASSISTS</span>
              <span className="pc-bottom-stat-value">{playerAssists}</span>
            </div>
          </div>
          <div className="pc-bottom-stat-divider" />
          <div className="pc-bottom-stat">
            <img
              src="/trophy.webp"
              alt="Challenges"
              className="pc-bottom-stat-icon"
            />
            <div className="pc-bottom-stat-info">
              <span className="pc-bottom-stat-label">CHALLENGES</span>
              <span className="pc-bottom-stat-value">{playerChallenges}</span>
            </div>
          </div>
        </div>

        {/* Specialization and QR Code Row */}
        <div className="pc-spec-qr-row">
          {/* Specialization Card (Left) */}
          <div className="pc-specialization">
            <div className="pc-spec-badge-glow">
              <div className="pc-spec-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00d2ff"
                  strokeWidth="2"
                  className="pc-spec-icon-svg"
                >
                  <path
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="pc-spec-info">
              <div className="pc-spec-title">{defaultSpec.title}</div>
              <div className="pc-spec-desc">{defaultSpec.description}</div>
            </div>
          </div>

          {/* QR Code Column (Right) */}
          <div className="pc-qr-container">
            <div className="pc-qr-code">
              {profileUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}`}
                  alt="QR Code"
                  className="pc-qr-img"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="pc-qr-loading-placeholder animate-pulse bg-slate-200 w-full h-full rounded" />
              )}
            </div>
            <div className="pc-qr-label">SCAN TO VIEW FULL PROFILE</div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="pc-achievements">
          <div className="pc-achievements-title">ACHIEVEMENTS</div>
          <div className="pc-achievements-grid">
            {defaultAchievements.map((ach, i) => (
              <div className="pc-achievement pc-achievement-locked" key={i}>
                <div className="pc-achievement-hexagon">
                  <img
                    src={ach.icon}
                    alt={ach.label}
                    className="pc-achievement-icon"
                  />
                  {/* Status Indicator (padlock locked) */}
                  <div className="pc-achievement-lock-status pc-lock-locked">
                    <svg viewBox="0 0 24 24" className="pc-lock-icon">
                      <path
                        fill="currentColor"
                        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                      />
                    </svg>
                  </div>
                </div>
                <span className="pc-achievement-label">{ach.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pc-footer">
          <div className="pc-footer-number">
            {String(data.mu_points % 100).padStart(2, "0")}
          </div>
          <div className="pc-footer-tagline">
            WE REPRESENT. WE BUILD. WE WIN.
            <div className="pc-footer-hashtag">#mufifa2026</div>
          </div>
          <div className="pc-footer-ball-wrapper">
            <img
              src="/playerCard/football.webp"
              alt="football"
              className="pc-footer-ball"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
