import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-full mt-auto border-t border-white/5 bg-glass-card backdrop-blur-md overflow-hidden z-20">
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-gradient-to-tr from-[#4F46E5]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 right-10 w-[300px] h-[300px] bg-gradient-to-bl from-[#06B6D4]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-7 flex flex-col gap-4 text-left">
            <Link
              href="/"
              className="flex items-center gap-1.5 cursor-pointer group"
            >
              <Image
                src="/trophy.png"
                alt="World Cup Trophy"
                width={15}
                height={40}
                className="h-8 md:h-10 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(6, 182, 212,0.45)] group-hover:scale-110 transition-transform duration-300"
              />
              <Image
                src="/logo.png"
                alt="μLearn Logo"
                width={189}
                height={60}
                className="h-8 md:h-15 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              For the Game. For the Spirit. Join the gamified hackathon
              organized by
              <span className="text-slate-200 font-medium">
                {" "}
                μLearn Foundation
              </span>{" "}
              &<span className="text-[#00E676] font-medium"> μLearn MCE</span>.
              Complete drills, wager µ-Points, and lead your squad to the top of
              the leaderboard.
            </p>

            <div className="flex items-center gap-4 mt-2">
              {[
                {
                  name: "Discord",
                  url: "https://discord.com/invite/gtech-mulearn-771670169691881483",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                    </svg>
                  ),
                },
                {
                  name: "Twitter",
                  url: "https://x.com/mulearnofficial",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  name: "Instagram",
                  url: "https://instagram.com/mulearn",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  name: "GitHub",
                  url: "https://github.com/gtech-mulearn",
                  icon: (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                      />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#4F46E5] hover:shadow-[0_0_10px_rgba(79, 70, 229,0.3)] bg-white/5 transition-all duration-300 transform hover:-translate-y-0.5"
                  title={social.name}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-6 md:gap-4 text-left">
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-white/5 pb-1">
                Platform
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                {[
                  { name: "Home", href: "/" },
                  { name: "Register", href: "/register" },
                  { name: "LeaderBoard", href: "/leaderboard" },
                  // { name: "Products", href: "#" },
                  // { name: "Events", href: "#" },
                  // { name: "Sevapalley", href: "#" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-white/5 pb-1">
                Legal
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-slate-400">
                {[
                  {
                    name: "Privacy Policy",
                    href: "https://mulearn.org/privacypolicy",
                  },
                  {
                    name: "Terms & Conditions",
                    href: "https://mulearn.org/termsandconditions",
                  },
                   {
                    name: "Community Guidelines",
                    href: "/community-guidelines",
                  },
                ].map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <p className="text-[10px] text-slate-500">
            © 2026 μLearn Foundation. All rights reserved. Created and
            maintained for µFifa'26.
          </p>
          <div className="flex items-center gap-5">
            <Image
              src="/gtech.png"
              alt="GTech Logo"
              width={90}
              height={28}
              className="h-7 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
            />
            <Image
              src="/mulearnFoundation.png"
              alt="μLearn Foundation Logo"
              width={90}
              height={28}
              className="h-7 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </div>
      </div>

      <div
        className="absolute right-0 top-8 -translate-y-1/2 translate-x-[25%] flex flex-col items-center justify-center h-40 w-40 pointer-events-none select-none z-10 overflow-visible"
        aria-hidden="true"
      >
        <div className="relative w-44 h-44 flex items-center justify-center animate-[spin_25s_linear_infinite]">
          <Image
            src="/football.png"
            alt="Revolving Football"
            width={96}
            height={96}
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(6, 182, 212,0.45)] select-none pointer-events-none"
          />
        </div>
      </div>
    </footer>
  );
}
