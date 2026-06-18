"use client";

import React, { useRef, useEffect } from "react";

/**
 * BallLoader Component
 * Renders the custom ball_loader video in a loop with a transparent background
 * using CSS mix-blend-mode (screen composite).
 *
 * @param {string} className - Optional Tailwind or custom CSS classes
 * @param {number|string} size - The width and height of the loader container
 * @param {string} blendMode - The blend mode to apply (defaults to 'screen')
 */
export default function BallLoader({ className = "", size = 120, blendMode = "screen", fullScreen = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.log("BallLoader autoplay prevented:", err);
      });
    }
  }, []);

  const containerStyle = fullScreen
    ? {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        zIndex: 99999,
      }
    : {
        width: size,
        height: size,
        mixBlendMode: blendMode,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      };

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "bg-[#090A0F]/85 backdrop-blur-[3px]" : "bg-transparent"
      } ${className}`}
      style={containerStyle}
    >
      <video
        ref={videoRef}
        src="/ball_loader.mp4"
        type="video/mp4"
        muted
        loop
        playsInline
        className={`w-full h-full bg-transparent pointer-events-none ${fullScreen ? "object-cover" : "object-contain"}`}
        style={{ 
          mixBlendMode: blendMode,
          transform: "translateZ(0)"
        }}
      />
    </div>
  );
}
