"use client";

import React from "react";
import Link from "next/link";

export default function CommunityGuidelinesPage() {
  return (
    <div className="w-full min-h-screen bg-[#090A0F] text-white flex flex-col font-sans relative select-none pb-16 pt-8 md:pt-12 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06)_0%,#090A0F_80%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#090A0F] via-transparent to-[rgba(6,182,212,0.06)] pointer-events-none" />
      <div className="absolute top-[10%] right-[5%] w-[55vw] h-[55vw] bg-[#4f46e5]/8 pointer-events-none rounded-full blur-[130px]" />
      <div className="absolute bottom-[10%] left-[-10%] w-[55vw] h-[55vw] bg-[#06b6d4]/8 pointer-events-none rounded-full blur-[130px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] bg-clip-text text-transparent">
            μ FIFA '26
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-200 mb-2">
            Official Community Guidelines & Fair Play Playbook
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            We are fully committed to creating a safe, open, and high-energy arena for expression, community building, and collaboration.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 md:p-8 mb-8 backdrop-blur-sm">
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4">
            As a participant in <span className="font-semibold text-white">μ FIFA '26</span>, an initiative by <span className="font-semibold">μlearn Foundation</span>, innovation and supported by <span className="font-semibold">MCE</span> and <span className="font-semibold">μ Learn</span>, you are required to understand and comply with these Community Guidelines at all times.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <Section
            number="1"
            title="Applicability"
            content={
              <p className="text-slate-300">
                These guidelines apply to any and all content created, uploaded, hosted, shared, or otherwise communicated on or via Our Platform ("Content"). This includes watch parties, live streams, group chats, Discord interactions, text comments, links, code repositories, and thumbnails.
              </p>
            }
          />

          {/* Section 2 */}
          <Section
            number="2"
            title="The Official μ FIFA Playbook: Know Your Stats"
            content={
              <div className="space-y-4">
                <p className="text-slate-300">
                  We don't just track progress—we track your legacy. Familiarize yourself with the official gamified stats of the tournament:
                </p>
                <div className="space-y-3">
                  <StatItem
                    label="μ Points (Tournament Currency)"
                    description="The core digital reward of the event. μ Points are awarded to each player based on their individual performance, overall activeness on the platform, and specific criteria met during events and daily tasks."
                  />
                  <StatItem
                    label="Goals (Points)"
                    description="The ultimate measure of your success on the leaderboard, converted directly from your hard-earned rewards (e.g., 10 μ Points = 1 Goal)."
                  />
                  <StatItem
                    label="Assists (Referrals)"
                    description="Bring a friend into the tournament! For every successful referral that joins, you register an Assist and earn an instant 5 μ Points."
                  />
                  <StatItem
                    label="Matches Played (Completed Tasks)"
                    description="Every technical drill, challenge, or mission you successfully complete."
                  />
                  <StatItem
                    label="Nation Ranking (Team Leaderboard)"
                    description="Where your country stands on the global stage. Your goals directly push your nation up the ranks."
                  />
                  <StatItem
                    label="Captain (Community Leader)"
                    description="The playmaker guiding the squad and organizing strategies."
                  />
                  <StatItem
                    label="MVP (Weekly Champion)"
                    description="The standout player of the week who dominated the pitch with their performance and activeness."
                  />
                  <StatItem
                    label="Golden Boot (Top Contributor)"
                    description="Awarded to the player who racks up the most overall contributions by the final whistle."
                  />
                </div>
              </div>
            }
          />

          {/* Section 3 */}
          <Section
            number="3"
            title="The Safe Zone: Friendly Feuds & Match Banter"
            content={
              <div className="space-y-4">
                <p className="text-slate-300">
                  We actively celebrate passionate fan rivalries! A World Cup is nothing without high stakes and locker room talk. We encourage our players to engage in lively debates, match banter, and friendly feuds.
                </p>
                <p className="text-slate-300 font-semibold text-white">To keep the pitch clean, stick to the fair play rulebook:</p>
                <div className="space-y-3">
                  <RuleItem
                    title="Keep it Sportsmanlike"
                    description="Back your nation, drop your creative memes, and debate the leaderboards with passion."
                  />
                  <RuleItem
                    title="No Personal Harm"
                    description="Banter must never cross the line into causing emotional, psychological, physical, or personal distress to another participant."
                  />
                  <RuleItem
                    title="Parliamentary Conduct Only"
                    description="The use of unparliamentary words, toxic slurs, abusive language, or aggressive digital actions is strictly prohibited."
                  />
                  <RuleItem
                    title="The Golden Rule"
                    description="Attack the problem, counter the strategy, but always respect the player."
                  />
                </div>
              </div>
            }
          />

          {/* Section 4 */}
          <Section
            number="4"
            title="Prohibited Content & Conduct (Major Fouls)"
            content={
              <div className="space-y-4">
                <p className="text-slate-300">
                  To ensure a high-quality, competitive arena, the following are strictly prohibited:
                </p>
                <div className="space-y-3">
                  <ProhibitedItem
                    title="Spam and Deceptive Engagement"
                    description="Flooding chats or live streams with messages. Using bots, scripts, or engagement baiting to promote illegal or unrelated activities."
                  />
                  <ProhibitedItem
                    title="Task Integrity (Strictly No 'Frauds')"
                    description="μ players are expected to uphold absolute integrity. Using fraudulent shortcuts, bypasses, or any fraudulent completion of tasks is strictly banned."
                  />
                  <ProhibitedItem
                    title="Misinformation & Impersonation"
                    description="Unlawfully impersonating another student or organization, or spreading fake event news/leaderboard rumors."
                  />
                  <ProhibitedItem
                    title="Violent & Dangerous Behavior"
                    description="Content that advocates physical harm, promotes illicit activities, or threatens public order."
                  />
                  <ProhibitedItem
                    title="Harassment, Bullying & Doxxing"
                    description="Attacking individuals based on personal traits, or sharing private information (e.g., phone numbers)."
                  />
                  <ProhibitedItem
                    title="Hate Speech"
                    description="Content that demeans or threatens anyone based on race, ethnicity, religion, caste, gender, sexual orientation, or disability."
                  />
                  <ProhibitedItem
                    title="Intellectual Property Violations"
                    description="Plagiarizing code/artwork, or reusing platform content in a misleading manner that misrepresents facts."
                  />
                  <ProhibitedItem
                    title="Sexually Offensive Content"
                    description="Displaying explicit activities, nudity, or engaging in any form of predatory behavior (zero-tolerance policy)."
                  />
                </div>
              </div>
            }
          />

          {/* Section 5 */}
          <Section
            number="5"
            title="Strict Prohibition of Real Money Usage"
            content={
              <div className="space-y-4">
                <div className="space-y-3">
                  <ProhibitedItem
                    title="No Real-World Currency"
                    description="This tournament is entirely gamified for learning. The platform does not involve or permit any usage of real money, real-world currency transactions, or financial betting."
                  />
                  <ProhibitedItem
                    title="Virtual Tokens Only"
                    description="μ Points and Karma points are strictly digital milestones used to track leaderboard progress. They hold absolutely no real-world monetary value and cannot be traded or wagered for real cash."
                  />
                  <ProhibitedItem
                    title="Financial Fraud Prohibited"
                    description="Requesting real money transfers, investments, or running financial scams will result in immediate disqualification and legal escalation."
                  />
                </div>
              </div>
            }
          />

          {/* Section 6 */}
          <Section
            number="6"
            title="The Referee's Whistle: Penalties & Enforcement"
            content={
              <div className="space-y-4">
                <p className="text-slate-300">
                  If a participant or team violates these Community Guidelines or the rules of the game, actions will be taken using our official penalty system:
                </p>
                <div className="space-y-3">
                  <PenaltyItem
                    title="Yellow Card (Missed Deadlines & Minor Offenses)"
                    description="Clock management is key. Missed a task deadline or received a minor behavioral warning? That's a Yellow Card. Play carefully."
                  />
                  <PenaltyItem
                    title="Penalties (Point Deductions)"
                    description="Bending the rules or submitting a sloppy drill will result in a penalty, costing your squad hard-earned goals (point deductions) on the leaderboard."
                  />
                  <PenaltyItem
                    title="Red Card (Immediate Disqualification)"
                    description="Zero tolerance. Any toxic behavior, hate speech, severe harassment, cheating, or using 'fraud' ways to bypass tasks results in a straight Red Card. This means an immediate, permanent ban from the platform, forfeiture of all μ Points/Karma, and potential disqualification of your entire squad."
                  />
                </div>
              </div>
            }
          />

          {/* Section 7 */}
          <Section
            number="7"
            title="Report a Foul"
            content={
              <p className="text-slate-300">
                Help us keep the tournament safe and competitive. If you spot any content, messages, or behavior that breaks the rules of the game, use the <span className="font-semibold text-white">Report</span> button instantly or reach out directly to the Help & Support team with screenshots.
              </p>
            }
          />
        </div>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-slate-400 text-sm">
            Thank you for helping us build a world-class community!
          </p>
          <Link
            href="/leaderboard"
            className="px-6 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] hover:from-[#4F46E5]/90 hover:to-[#06B6D4]/90 rounded-lg font-semibold text-sm text-white transition-all duration-300 cursor-pointer"
          >
            Back to Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Component: Section
function Section({ number, title, content }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 md:p-8 backdrop-blur-sm hover:border-white/20 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-lg flex items-center justify-center font-bold text-white">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">{title}</h3>
          {content}
        </div>
      </div>
    </div>
  );
}

// Component: StatItem
function StatItem({ label, description }) {
  return (
    <div className="pl-4 border-l-2 border-[#4F46E5]/50">
      <p className="font-semibold text-white text-sm md:text-base">{label}</p>
      <p className="text-slate-400 text-xs md:text-sm mt-1">{description}</p>
    </div>
  );
}

// Component: RuleItem
function RuleItem({ title, description }) {
  return (
    <div className="pl-4 border-l-2 border-[#06B6D4]/50">
      <p className="font-semibold text-white text-sm md:text-base">{title}</p>
      <p className="text-slate-400 text-xs md:text-sm mt-1">{description}</p>
    </div>
  );
}

// Component: ProhibitedItem
function ProhibitedItem({ title, description }) {
  return (
    <div className="pl-4 border-l-2 border-red-500/50">
      <p className="font-semibold text-white text-sm md:text-base">{title}</p>
      <p className="text-slate-400 text-xs md:text-sm mt-1">{description}</p>
    </div>
  );
}

// Component: PenaltyItem
function PenaltyItem({ title, description }) {
  return (
    <div className="pl-4 border-l-2 border-yellow-500/50">
      <p className="font-semibold text-white text-sm md:text-base">{title}</p>
      <p className="text-slate-400 text-xs md:text-sm mt-1">{description}</p>
    </div>
  );
}
