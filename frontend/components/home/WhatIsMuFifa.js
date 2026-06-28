"use client";
import React from "react";
import Image from "next/image";

export default function WhatIsMuFifa() {
  const features = [
    {
      title: "Global Competition",
      desc: "Compete with fans from around the world.",
      icon: "/hero/heart.webp",
    },
    {
      title: "Fun Challenges",
      desc: "Play, predict matches and complete challenges.",
      icon: "/hero/game.webp",
    },
    {
      title: "Earn µPoints",
      desc: "Climb the ranks and earn amazing rewards.",
      icon: "/hero/bell.webp",
    },
    {
      title: "Lift the Cup",
      desc: "Help your nation become world champion.",
      icon: "/hero/video.webp",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-t-[#1E1B4B]/30 border-b border-b-[#1E1B4B]/30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Title and Subtitle */}
        <div className="lg:col-span-4 text-left flex flex-col justify-start">
          <h2 className="text-3xl md:text-4xl font-black tracking-wider mb-4 leading-tight text-white">
            What is <span className="text-[#A78BFA]"><span className="normal-case">µ</span>FIFA</span>?
          </h2>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-sm font-medium">
            μFIFA is a large-scale innovation movement by μLearn that turns learning 
            into a collaborative, gamified experience inspired by the FIFA World Cup. 
            Participants join national squads, pick a domain of expertise, and work with 
            peers on real-world challenges while representing their team.
          </p>
        </div>

        {/* Right Column: 4 features in columns (2 in a row on mobile) */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-6 lg:mt-0">
          {features.map((feat) => (
            <div key={feat.title} className="flex flex-col items-center group">
              <div
                className={`w-21 h-21 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <Image
                  src={feat.icon}
                  alt={feat.title}
                  width={80}
                  height={38}
                  className="object-contain"
                />
              </div>
              <h3 className="text-sm font-extrabold text-white mb-2 leading-snug">
                {feat.title}
              </h3>
              <p className="text-[11px] text-[#8A8A9E] leading-relaxed max-w-[150px]">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
