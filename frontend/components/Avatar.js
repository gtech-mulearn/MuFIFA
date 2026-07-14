import React from "react";



export function getFrameClass(equippedFrame) {
  if (!equippedFrame) return "";
  const f = equippedFrame.toLowerCase();
  if (f.includes("bronze")) return "avatar-frame-bronze";
  if (f.includes("silver")) return "avatar-frame-silver";
  if (f.includes("gold")) return "avatar-frame-gold";
  if (f.includes("neon")) return "avatar-frame-neon";
  if (f.includes("fire") || f.includes("fiery")) return "avatar-frame-fire";
  return "";
}

export function getInitials(name) {
  if (!name) return "⚽";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  avatarUrl,
  name,
  equippedFrame,
  sizeClass = "w-10 h-10",
  initialsSizeClass = "text-xs",
  borderClass = "border border-white/10"
}) {
  const frameClass = getFrameClass(equippedFrame);

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${sizeClass}`}
      style={{ overflow: "visible" }}
    >
      {/* Avatar Inner Circle */}
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center bg-slate-900 ${
          frameClass
            ? `${frameClass} p-[3px] w-full h-full`
            : `${borderClass} w-full h-full`
        }`}
      >
        {avatarUrl && avatarUrl.trim().length > 0 ? (
          <img
            src={avatarUrl}
            alt={name || "Avatar"}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 font-extrabold text-white rounded-full ${initialsSizeClass}`}>
            {getInitials(name)}
          </div>
        )}
      </div>
    </div>
  );
}
