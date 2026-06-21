"use client";

import React from "react";
import Image from "next/image";

export default function Partners() {
  const partners = [
    { name: "Puma", path: "/Logos/partners/puma.png", width: 90, height: 40 },
    { name: "EA Sports", path: "/Logos/partners/ea.png", width: 100, height: 40 },
    { name: "Nike", path: "/Logos/partners/nike.png", width: 90, height: 40 },
    { name: "Adidas", path: "/Logos/partners/adidas.png", width: 90, height: 40 },
    { name: "FIFA", path: "/Logos/partners/fifa.png", width: 90, height: 40 },
    { name: "Coca-Cola", path: "/Logos/partners/coca_cola.png", width: 100, height: 40 },
    { name: "Gatorade", path: "/Logos/partners/gatorade.png", width: 100, height: 40 },
  ];

  return (
    <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 border-t border-white/5">
      <div className="text-center mb-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">FEATURED PARTNERS</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16 opacity-60 hover:opacity-85 transition-opacity duration-300">
        {partners.map((p) => (
          <div key={p.name} className="relative h-10 w-24 md:w-28 flex items-center justify-center grayscale contrast-200 brightness-200">
            {/* We render both text placeholder and an Image tag. 
                If the image fails to load or isn't there, the text is a fallback. */}
            <span className="text-sm font-black text-slate-500 tracking-wider uppercase block select-none">
              {p.name}
            </span>
            {/* Invisible real image tag that the user can wire up */}
            <Image
              src={p.path}
              alt={`${p.name} Logo`}
              width={p.width}
              height={p.height}
              className="absolute inset-0 object-contain w-full h-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
              onError={(e) => {
                // Keep it hidden if failed
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
