export const TEAM_WHATSAPP_LINKS = {
  Brazil: "https://chat.whatsapp.com/EV8id4d16MGIXdmmpDtx7g",
  Argentina: "https://chat.whatsapp.com/BhddYg7jtG24SpEP9XmYvf",
  Portugal: "https://chat.whatsapp.com/Ec6u5gbzXaBLsKJOVdMSgB",
  Germany: "https://chat.whatsapp.com/KwNWCzEWyCJA24NmeacfLM",
  France: "https://chat.whatsapp.com/LY2EOqz9pXYClO7ZfIwybU",
  England: "https://chat.whatsapp.com/KnJcWM2Bb7M32TnT68LtUI",
  Spain: "https://chat.whatsapp.com/DAIaHMOjt3P6DrAdaD3EDv",
  Netherlands: "https://chat.whatsapp.com/BFLIlE9IdenBzj7R4zfGW9",
  Belgium: "https://chat.whatsapp.com/H8ibvdnnBSaLORa4gguG5M",
  Croatia: "https://chat.whatsapp.com/FkLUDYocKur6EWkSCSKNaN",
  Uruguay: "https://chat.whatsapp.com/DEYKZdZ65NG15zhIaxpAcK",
  Japan: "https://chat.whatsapp.com/Ccg1WGLaize3hgcVLUqZHF",
};
export const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];

export const TEAM_FLAGS = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

export const TEAM_FLAG_BGS = {
  Argentina: "/playerCard/flag/argentina.webp",
  Brazil: "/playerCard/flag/brazil.webp",
  England: "/playerCard/flag/england.webp",
  Japan: "/playerCard/flag/japan.webp",
  Portugal: "/playerCard/flag/portugal.webp",
  Netherlands: "/playerCard/flag/netherlands.webp",
  Belgium: "/playerCard/flag/belgium.webp",
  Spain: "/playerCard/flag/spain.webp",
  Uruguay: "/playerCard/flag/uruguay.webp",
  Germany: "/playerCard/flag/germany.webp",
  France: "/playerCard/flag/france.webp",
  Croatia: "/playerCard/flag/crotia.webp",
};

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  800,    // Level 2
  1200,   // Level 3
  1800,   // Level 4
  2600,   // Level 5
  3000,   // Level 6
  3500,   // Level 7
  4000,   // Level 8
  4500,   // Level 9
  5000,   // Level 10
  5500,   // Level 11
  6000    // Level 12
];

export const calculateLevel = (xp) => {
  let level = 1;
  let nextXp = LEVEL_THRESHOLDS[1];
  let currentLevelXp = xp;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      const nextThreshold = LEVEL_THRESHOLDS[i + 1];
      if (nextThreshold) {
        nextXp = nextThreshold - LEVEL_THRESHOLDS[i];
        currentLevelXp = xp - LEVEL_THRESHOLDS[i];
      } else {
        // Max level reached
        nextXp = 0;
        currentLevelXp = xp - LEVEL_THRESHOLDS[i];
      }
    } else {
      break;
    }
  }

  return {
    level,
    currentLevelXp,
    nextXp,
    xpPercent: nextXp > 0 ? Math.min(Math.round((currentLevelXp / nextXp) * 100), 100) : 100,
  };
};
