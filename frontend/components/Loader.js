"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.log("Loader autoplay prevented:", err);
      });
    }

    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 3200);

    const removeTimeout = setTimeout(() => {
      setVisible(false);
    }, 3700);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#04060d] flex flex-col items-center justify-center transition-all duration-500 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative w-full max-w-[280px] sm:max-w-[360px] aspect-square flex items-center justify-center">
        <div className="absolute inset-0 bg-[#FF2E93]/5 rounded-full blur-3xl animate-pulse" />
        
        <video
          ref={videoRef}
          src="/loader.mp4"
          type="video/mp4"
          muted
          playsInline
          className="w-full h-full object-contain relative z-10"
          onEnded={() => {
            setFadeOut(true);
            setTimeout(() => setVisible(false), 500);
          }}
        />
      </div>
    </div>
  );
}
