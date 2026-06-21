"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

const PARTNERS = [
  {
    name: "µLearn Foundation",
    logo: "/Logos/mulearnFoundation.png",
    url: "https://mulearn.org",
  },
  {
    name: "Faya",
    logo: "https://fayausa.com/wp-content/themes/faya/assets/img/faya-home.png",
    url: "https://fayausa.com/",
  },
  {
    name: "µLearn MCE",
    logo: "/Logos/mulearnMce.png",
    url: "https://mulearn.org",
  },
  {
    name: "GTech",
    logo: "/Logos/gtech.png",
    url: "https://gtech.org",
  },
  {
    name: "Zycoz",
    logo: "https://www.zycoz.com/web/image/website/1/logo/Zycoz?unique=c28f218",
    url: "https://www.zycoz.com/",
  },
];

export default function TrustedCommunity() {
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollPos = 0;
    const speed = 0.4; // px per frame

    const animate = () => {
      scrollPos += speed;
      // The duplicated list is twice the original width; reset when half is scrolled
      const halfWidth = container.scrollWidth / 2;
      if (scrollPos >= halfWidth) {
        scrollPos = 0;
      }
      container.style.transform = `translateX(-${scrollPos}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleMouseEnter = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    const handleMouseLeave = () => {
      animationRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Duplicate the list for seamless infinite scroll
  const allPartners = [...PARTNERS, ...PARTNERS];

  return (
    <section className="relative z-10 w-full py-16 border-t border-white/5">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider mb-3 text-white">
          TRUSTED{" "}
          <span className="text-[#A78BFA] drop-shadow-[0_0_15px_rgba(167,139,250,0.25)]">
            PARTNERS
          </span>
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          We collaborate with leading organizations to deliver an unmatched
          competitive experience.
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden w-full py-4">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#090A0F] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#090A0F] to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex items-center gap-16 md:gap-24 w-max"
        >
          {allPartners.map((partner, idx) => (
            <a
              key={`${partner.name}-${idx}`}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group shrink-0 transition-all duration-300"
            >
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                width={80}
                height={80}
                className="object-contain w-16 h-16 md:w-24 md:h-24 opacity-40 group-hover:opacity-90 transition-opacity duration-300 brightness-0 invert"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
