import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { CountdownSkeleton } from "./CountdownSection";
import Link from "next/link";

const CountdownSection = dynamic(() => import("./CountdownSection"), {
  ssr: false,
  loading: () => <CountdownSkeleton />,
});

export default function MetagameSection() {
  return (
    <div className="relative z-20 flex flex-col gap-6 lg:gap-8 border-t border-white/5 pt-10 lg:pt-18 mt-auto w-full">
      <div className="flex flex-wrap items-center justify-center lg:justify-between gap-6 w-full">
        <div className="flex items-center justify-center gap-3 w-full lg:w-auto pt-4 lg:pt-0">
          <Link href="https://mulearn.org">
            <Image
              src="/Logos/mulearnFoundation.png"
              alt="μLearn Foundation Logo"
              width={135}
              height={135}
              priority
              className="object-contain hover:scale-105 transition-transform duration-300"
            />
          </Link>
          <div className="text-slate-200 text-xs font-bold px-1">×</div>
          <Link href="https://mulearnmce.adhwaithas.dev/">
            <Image
              src="/Logos/mulearnMce.png"
              alt="μLearn MCE Logo"
              width={135}
              height={135}
              priority
              className="object-contain rounded hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        <div className="hidden lg:block w-full lg:w-auto">
          <CountdownSection />
        </div>
      </div>

      <div className="flex flex-col w-full border-t border-white/5 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-extrabold uppercase tracking-wider text-slate-200">
              3-Tier Gameplay
            </h3>
            <p className="text-xs text-slate-400">
              Join the race, build your squad, and claim the championship.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 1,
              num: "01",
              name: "Enter The Arena",
              desc: "Start your journey in μfifa. Register & choose your country.",
              border: "border-[#4F46E5]/30",
              bar: "bg-[#4F46E5]",
            },
            {
              id: 2,
              num: "02",
              name: "Find the GOAT",
              desc: "Choose your captain. Build a goated team to enter the ground.",
              border:
                "border-[#06B6D4]/40 shadow-[0_0_12px_rgba(6, 182, 212,0.15)]",
              bar: "bg-[#06B6D4]",
            },
            {
              id: 3,
              num: "03",
              name: "Match Time",
              desc: "The Sprint Begins. Battle for your team & get the μcup",
              border: "border-white/20",
              bar: "bg-white",
            },
          ].map((tier) => (
            <div
              key={tier.id}
              className={`p-4 rounded-xl bg-glass border ${tier.border} flex flex-col justify-between h-full transform transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] hover:bg-white/[0.04]`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">
                    {tier.num}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${tier.bar}`} />
                </div>
                <h4 className="text-sm font-extrabold truncate leading-tight text-white mb-1.5">
                  {tier.name}
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {tier.desc}
                </p>
              </div>
              <div className="w-full h-[3px] bg-slate-800 rounded-full overflow-hidden mt-3">
                <div className={`h-full w-full ${tier.bar}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
