"use client";

import React from "react";
import Image from "next/image";

export default function HowItWorks() {
  const steps = [
    {
      title: "Choose Your Nation",
      desc: "Pick your favorite country and represent it.",
      icon: "/how_it_works/flag.png",
    },
    {
      title: "Play & Predict",
      desc: "Take on challenges and predict match outcomes.",
      icon: "/how_it_works/target.png",
    },
    {
      title: "Earn µPoints",
      desc: "Score points, climb the ranks and unlock achievements.",
      icon: "/how_it_works/points.png",
    },
    {
      title: "Climb the Ranks",
      desc: "Compete with players worldwide.",
      icon: "/how_it_works/ranks.png",
    },
    {
      title: "Lift the Cup",
      desc: "Help your nation become World Cup champions.",
      icon: "/how_it_works/cup.png",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider mb-14 text-center text-white">
        HOW{" "}
        <span className="text-[#A78BFA] drop-shadow-[0_0_15px_rgba(167,139,250,0.25)]">
          µFIFA
        </span>{" "}
        WORKS
      </h2>

      <div className="flex flex-wrap lg:flex-nowrap items-start justify-center lg:justify-between gap-x-6 gap-y-10 lg:gap-4 relative w-full">
        {steps.map((item, idx) => (
          <React.Fragment key={item.title}>
            <div className="flex flex-col items-center text-center w-[calc(50%-12px)] lg:w-auto lg:flex-1 max-w-[200px] relative group">
              {/* Icon container */}
              <div className="w-24 h-24 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 z-10">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={96}
                  height={96}
                  className="object-contain mix-blend-screen filter drop-shadow-[0_0_12px_rgba(167,139,250,0.5)]"
                />
              </div>

              {/* Text */}
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                {item.title}
              </h3>
              <p className="text-[11px] text-[#8A8A9E] leading-relaxed max-w-[160px]">
                {item.desc}
              </p>
            </div>

            {/* Dotted Arrow separator (Desktop only) */}
            {idx < steps.length - 1 && (
              <div className="hidden lg:flex items-center justify-center flex-1 h-24 relative z-0">
                <div className="w-12 border-t-2 border-dotted border-[#A78BFA]/30 relative">
                  <div className="absolute right-0 -top-[5px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#A78BFA]/40 rotate-45" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
