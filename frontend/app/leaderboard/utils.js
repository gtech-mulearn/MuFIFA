export const FLAGS = {
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

export const TEAMS = Object.keys(FLAGS);

export const SQUAD_PHOTOS = {
  Brazil: "/players/brazil_back.svg",
  Argentina: "/players/argentina_back.svg",
  Portugal: "/players/portugal_back.svg",
  Germany: "/players/germany_back.png",
  Japan: "/players/japan_back.svg",
};

export const SQUAD_PHOTOS_FRONT = {
  Brazil: "/players/brazil_front.svg",
  Argentina: "/players/argentina_front.svg",
  Portugal: "/players/portugal_front.svg",
  Germany: "/players/germany_front.png",
  Japan: "/players/japan_front.svg",
};

export const HAS_SQUAD_PHOTOS = Object.keys(SQUAD_PHOTOS_FRONT);

// Resolves the image path for a team jersey back or front fallback.
export const getSquadPhoto = (teamName) => {
  if (SQUAD_PHOTOS[teamName]) return SQUAD_PHOTOS[teamName];
  const formatted = teamName.toLowerCase().replace(/\s+/g, "_");
  if (formatted === "germany") return "/players/germany_front.png";
  return `/players/${formatted}_front.svg`;
};

// Resolves the image path for a team jersey front if it exists.
export const getSquadPhotoFront = (teamName) => {
  if (HAS_SQUAD_PHOTOS.includes(teamName)) {
    return SQUAD_PHOTOS_FRONT[teamName];
  }
  return null;
};

// Returns Tailwind background, border, text, and glow classes matching the rank.
export const getRankStyle = (rank) => {
  if (rank === 1) {
    return "bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.15)]";
  }
  if (rank === 2) {
    return "bg-[#94A3B8]/10 border-[#94A3B8]/30 text-[#E2E8F0] shadow-[0_0_8px_rgba(148,163,184,0.15)]";
  }
  if (rank === 3) {
    return "bg-[#D97706]/10 border-[#D97706]/30 text-[#F97316]";
  }
  return "bg-white/5 border-white/10 text-slate-400";
};

// Generates two-letter initials from a player's full name.
export const getInitials = (name) => {
  if (!name) return "⚽";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
