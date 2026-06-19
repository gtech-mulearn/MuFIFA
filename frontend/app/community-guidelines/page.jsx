"use client";

import React from "react";
import Link from "next/link";

const STAT_ITEMS = [
  {
    label: "μ Points (Tournament Currency)",
    description:
      "The core digital reward of the event. μ Points are awarded to each player based on their individual performance, overall activeness on the platform, and specific criteria met during events and daily tasks.",
  },
  {
    label: "Goals (Points)",
    description:
      "The ultimate measure of your success on the leaderboard, converted directly from your hard-earned rewards (e.g., 10 μ Points = 1 Goal).",
  },
  {
    label: "Assists (Referrals)",
    description:
      "Bring a friend into the tournament! For every successful referral that joins, you register an Assist and earn an instant 5 μ Points.",
  },
  {
    label: "Matches Played (Completed Tasks)",
    description:
      "Every technical drill, challenge, or mission you successfully complete.",
  },
  {
    label: "Nation Ranking (Team Leaderboard)",
    description:
      "Where your country stands on the global stage. Your goals directly push your nation up the ranks.",
  },
  {
    label: "Captain (Community Leader)",
    description: "The playmaker guiding the squad and organizing strategies.",
  },
  {
    label: "MVP (Weekly Champion)",
    description:
      "The standout player of the week who dominated the pitch with their performance and activeness.",
  },
  {
    label: "Golden Boot (Top Contributor)",
    description:
      "Awarded to the player who racks up the most overall contributions by the final whistle.",
  },
];

const RULE_ITEMS = [
  {
    title: "Keep it Sportsmanlike",
    description:
      "Back your nation, drop your creative memes, and debate the leaderboards with passion.",
  },
  {
    title: "No Personal Harm",
    description:
      "Banter must never cross the line into causing emotional, psychological, physical, or personal distress to another participant.",
  },
  {
    title: "Parliamentary Conduct Only",
    description:
      "The use of unparliamentary words, toxic slurs, abusive language, or aggressive digital actions is strictly prohibited.",
  },
  {
    title: "The Golden Rule",
    description:
      "Attack the problem, counter the strategy, but always respect the player.",
  },
];

const PROHIBITED_ITEMS = [
  {
    title: "Spam and Deceptive Engagement",
    description:
      "Flooding chats or live streams with messages. Using bots, scripts, or engagement baiting to promote illegal or unrelated activities.",
  },
  {
    title: "Task Integrity (Strictly No 'Frauds')",
    description:
      "μ players are expected to uphold absolute integrity. Using fraudulent shortcuts, bypasses, or any fraudulent completion of tasks is strictly banned.",
  },
  {
    title: "Misinformation & Impersonation",
    description:
      "Unlawfully impersonating another student or organization, or spreading fake event news/leaderboard rumors.",
  },
  {
    title: "Violent & Dangerous Behavior",
    description:
      "Content that advocates physical harm, promotes illicit activities, or threatens public order.",
  },
  {
    title: "Harassment, Bullying & Doxxing",
    description:
      "Attacking individuals based on personal traits, or sharing private information (e.g., phone numbers).",
  },
  {
    title: "Hate Speech",
    description:
      "Content that demeans or threatens anyone based on race, ethnicity, religion, caste, gender, sexual orientation, or disability.",
  },
  {
    title: "Intellectual Property Violations",
    description:
      "Plagiarizing code/artwork, or reusing platform content in a misleading manner that misrepresents facts.",
  },
  {
    title: "Sexually Offensive Content",
    description:
      "Displaying explicit activities, nudity, or engaging in any form of predatory behavior (zero-tolerance policy).",
  },
];

const MONEY_ITEMS = [
  {
    title: "No Real-World Currency",
    description:
      "This tournament is entirely gamified for learning. The platform does not involve or permit any usage of real money, real-world currency transactions, or financial betting.",
  },
  {
    title: "Virtual Tokens Only",
    description:
      "μ Points and Karma points are strictly digital milestones used to track leaderboard progress. They hold absolutely no real-world monetary value and cannot be traded or wagered for real cash.",
  },
  {
    title: "Financial Fraud Prohibited",
    description:
      "Requesting real money transfers, investments, or running financial scams will result in immediate disqualification and legal escalation.",
  },
];

const PENALTY_ITEMS = [
  {
    title: "Yellow Card (Minor Offenses)",
    description:
      "Clock management is key. Missed a task deadline or received a minor behavioral warning? That's a Yellow Card. Play carefully.",
  },
  {
    title: "Penalties (Point Deductions)",
    description:
      "Bending the rules or submitting a sloppy drill will result in a penalty, costing your squad hard-earned goals (point deductions) on the leaderboard.",
  },
  {
    title: "Red Card (Disqualification)",
    description:
      "Zero tolerance. Any toxic behavior, hate speech, severe harassment, cheating, or using 'fraud' ways to bypass tasks results in a straight Red Card. This means permanent ban and forfeiture of all points.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-28 md:pt-36 overflow-hidden">
      <div
        className="fixed inset-0 z-0 opacity-[0.3] pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/stadium_bg_pruble.webp')" }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[450px] z-0 opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg_img.webp')" }}
      />
      <div className="absolute top-0 left-0 right-0 h-[450px] z-0 bg-gradient-to-b from-transparent via-[#090A0F]/40 to-[#090A0F] pointer-events-none" />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.04)_0%,transparent_80%)] pointer-events-none" />
      <div className="absolute top-[10%] right-[5%] w-[50vw] h-[50vw] bg-[#4f46e5]/5 pointer-events-none rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50vw] h-[50vw] bg-[#06b6d4]/5 pointer-events-none rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-8">
        <div className="mb-12 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#4F46E5]/10 border border-[#4F46E5]/30 text-indigo-400 mb-4 tracking-wide uppercase">
            Fair Play Arena
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-3 bg-gradient-to-r from-white via-indigo-200 to-[#06B6D4] bg-clip-text text-transparent tracking-tight">
            μ FIFA '26
          </h1>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-200 mb-4 tracking-wide">
            Official Community Guidelines & Fair Play Playbook
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            We are fully committed to creating a safe, open, and high-energy
            arena for expression, community building, and collaboration.
          </p>
        </div>

        <div className="bg-white/[0.01] border border-white/5 md:rounded-2xl p-6 md:p-8 mb-12 backdrop-blur-md relative overflow-hidden shadow-2xl shadow-indigo-950/10">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#4F46E5] to-[#06B6D4]" />
          <p className="text-slate-300 text-sm md:text-base leading-relaxed pl-2">
            As a participant in{" "}
            <span className="font-semibold text-white">μ FIFA '26</span>—an
            initiative by the{" "}
            <span className="font-semibold text-white">μlearn Foundation</span>{" "}
            in partnership with{" "}
            <span className="font-semibold text-white">MCE</span>—you are
            required to understand and comply with these Community Guidelines at
            all times.
          </p>
        </div>

        <div className="space-y-8">
          <Section
            number="1"
            title="Applicability"
            content={
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                These guidelines apply to any and all content created, uploaded,
                hosted, shared, or otherwise communicated on or via Our Platform
                ("Content"). This includes watch parties, live streams, group
                chats, Discord interactions, text comments, links, code
                repositories, and thumbnails.
              </p>
            }
          />

          <Section
            number="2"
            title="The Official μ FIFA Playbook: Know Your Stats"
            content={
              <div className="space-y-6">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  We don't just track progress—we track your legacy. Familiarize
                  yourself with the official gamified stats of the tournament:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STAT_ITEMS.map((item, idx) => (
                    <StatItem
                      key={idx}
                      label={item.label}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            }
          />

          <Section
            number="3"
            title="The Safe Zone: Friendly Feuds & Match Banter"
            content={
              <div className="space-y-6">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  We actively celebrate passionate fan rivalries! A World Cup is
                  nothing without high stakes and locker room talk. We encourage
                  our players to engage in lively debates, match banter, and
                  friendly feuds.
                </p>
                <p className="text-slate-300 font-bold text-white text-sm md:text-base">
                  To keep the pitch clean, stick to the fair play rulebook:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RULE_ITEMS.map((item, idx) => (
                    <RuleItem
                      key={idx}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            }
          />

          <Section
            number="4"
            title="Prohibited Content & Conduct (Major Fouls)"
            content={
              <div className="space-y-6">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  To ensure a high-quality, competitive arena, the following are
                  strictly prohibited:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PROHIBITED_ITEMS.map((item, idx) => (
                    <ProhibitedItem
                      key={idx}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            }
          />

          <Section
            number="5"
            title="Strict Prohibition of Real Money Usage"
            content={
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MONEY_ITEMS.map((item, idx) => (
                    <ProhibitedItem
                      key={idx}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            }
          />

          <Section
            number="6"
            title="The Referee's Whistle: Penalties & Enforcement"
            content={
              <div className="space-y-6">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  If a participant or team violates these Community Guidelines
                  or the rules of the game, actions will be taken using our
                  official penalty system:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PENALTY_ITEMS.map((item, idx) => (
                    <PenaltyItem
                      key={idx}
                      title={item.title}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            }
          />

          <Section
            number="7"
            title="Report a Foul"
            content={
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Help us keep the tournament safe and competitive. If you spot
                any content, messages, or behavior that breaks the rules of the
                game, use the{" "}
                <span className="font-semibold text-white">Report</span> button
                instantly or reach out directly to the Help & Support team with
                screenshots.
              </p>
            }
          />
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-slate-400 text-sm">
            Thank you for helping us build a world-class community!
          </p>
          <Link
            href="/leaderboard"
            className="px-6 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] hover:from-[#4F46E5]/90 hover:to-[#06B6D4]/90 rounded-lg font-semibold text-sm text-white transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          >
            Back to Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ number, title, content }) {
  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-md hover:border-[#4F46E5]/30 hover:bg-[#4F46E5]/5 transition-all duration-500 shadow-xl shadow-black/25">
      <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] flex items-center justify-center font-bold text-lg text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/20 select-none">
          {number}
        </div>
        <div className="flex-1 w-full">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 tracking-wide">
            {title}
          </h3>
          {content}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, description }) {
  return (
    <div className="bg-[#4F46E5]/5 border border-[#4F46E5]/10 hover:border-[#4F46E5]/20 hover:bg-[#4F46E5]/8 rounded-xl p-4 flex gap-3.5 transition-all duration-300 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] group-hover:scale-110 transition-transform duration-300">
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-white text-sm md:text-base transition-colors group-hover:text-indigo-300">
          {label}
        </p>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function RuleItem({ title, description }) {
  return (
    <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/10 hover:border-[#06B6D4]/20 hover:bg-[#06B6D4]/8 rounded-xl p-4 flex gap-3.5 transition-all duration-300 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] group-hover:scale-110 transition-transform duration-300">
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-white text-sm md:text-base transition-colors group-hover:text-cyan-300">
          {title}
        </p>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProhibitedItem({ title, description }) {
  return (
    <div className="bg-red-500/5 border border-red-500/10 hover:border-red-500/20 hover:bg-red-500/8 rounded-xl p-4 flex gap-3.5 transition-all duration-300 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform duration-300">
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-white text-sm md:text-base transition-colors group-hover:text-red-300">
          {title}
        </p>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function PenaltyItem({ title, description }) {
  return (
    <div className="bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/20 hover:bg-amber-500/8 rounded-xl p-4 flex gap-3.5 transition-all duration-300 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-white text-sm md:text-base transition-colors group-hover:text-amber-300">
          {title}
        </p>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
