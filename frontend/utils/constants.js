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
export const DOMAINS = ["Coder", "Creative", "Maker", "Strategist"];

export const WHO_AM_I_OPTIONS = ["College Student", "School Student", "Other"];

export const KERALA_COLLEGES = [
  "CARMEL COLLEGE OF ENGINEERING AND TECHNOLOGY",
  "COLLEGE OF ENGINEERING KALLOOPARA",
  "COLLEGE OF ENGINEERING CHENGANNUR",
  "PROVIDENCE COLLEGE OF ENGINEERING & SCHOOL OF BUSINESS CHENGANNUR",
  "SREE BUDDHA COLLEGE OF ENGINEERING",
  "Cochin University College of Engineering, Kuttanadu",
  "Adi Shankara College of Engineering",
  "Ilahia College of Engineering and Technology",
  "Mar Elias College, Kottappady, Ernakulam",
  "MES COLLEGE OF ENGINEERING TECHNOLOGY KUNNUKARA",
  "MES MK MACKAR PILLAI COLLEGE FOR ADVANCED STUDIES",
  "MUTHOOT INSTITUTE OF TECHNOLOGY & SCIENCE",
  "Rajagiri School of Engineering and Technology",
  "SCMS School of Engineering and Technology",
  "SREE NARAYANA GURUKULAM COLLEGE OF ENGINEERING",
  "TocH Institute of Science and Technology",
  "VISAT ENGINEERING COLLEGE",
  "Viswajyothy College of Engineering and Technology",
  "Federal Institute of Science And Technology",
  "JAIN (Deemed-to-be University), Kochi",
  "GOVERNMENT ENGINEERING COLLEGE IDUKKI",
  "MAR BASELIOS CHRISTIAN COLLEGE OF ENGINEERING & TECHNOLOGY",
  "COLLEGE OF ENGINEERING THALASSERY",
  "GOVERNMENT COLLEGE OF ENGINEERING KANNUR",
  "KODIYERI BALAKRISHNAN MEMORIAL GOVERNMENT COLLEGE",
  "College of Engineering Trikaripur",
  "LBS COLLEGE OF ENGINEERING",
  "COLLEGE OF ENGINEERING - KOTTARAKKARA",
  "COLLEGE OF ENGINEERING - PATHANAPURAM",
  "COLLEGE OF ENGINEERING KARUNAGAPPALLY",
  "COLLEGE OF ENGINEERING PERUMON",
  "AMAL JYOTHI COLLEGE OF ENGINEERING KANJIRAPPALLY",
  "Kottayam Institute of Science and Technology",
  "KRISTU JYOTI COLLEGE OF MANAGEMENT AND TECHNOLOGY",
  "Rajiv Gandhi Institute of Technology Kottayam",
  "SAINTGITS COLLEGE OF ENGINEERING",
  "ST JOSEPHS COLLEGE OF ENGINEERING AND TECHNOLOGY PALAI",
  "AWH ENGINEERING COLLEGE",
  "College Of Applied Science IHRD, Kozhikode",
  "COLLEGE OF ENGINEERING VADAKARA",
  "GOVT. ENGINEERING COLLEGE - KOZHIKODE",
  "Muhammad Abdurahiman Memorial Orphanage College",
  "National Institute of Technology Calicut",
  "St. Josephs College Devagiri (Autonomous)",
  "Sree Gokulam Arts and Science College Baluserry",
  "Al Shifa College of Arts and Science",
  "CHMKM GOVT ARTS AND SCIENCE COLLEGE TANUR",
  "Malabar College of Advanced Studies",
  "MES COLLEGE OF ENGINEERING - KUTTIPPURAM",
  "MES PONNANI COLLEGE",
  "COLLEGE OF APPLIED SCIENCE, VADAKKENCHERRY",
  "GOVERNMENT ENGINEERING COLLEGE SREEKRISHNAPURAM",
  "MOUNT SEENA COLLEGE OF ARTS AND SCIENCE",
  "NSS College of Engineering Palakkad",
  "SREEPATHY INSTITUTE OF MANAGEMENT AND TECHNOLOGY",
  "AHALIA SCHOOL OF ENGINEERING AND TECHNOLOGY",
  "AL AMEEN ENGINEERING COLLEGE",
  "COLLEGE OF ENGINEERING ARANMULA",
  "COLLEGE OF ENGINEERING KALLOOPPARA",
  "MUSALIAR COLLEGE OF ARTS AND SCIENCE PATHANAMTHITTA",
  "CHRIST COLLEGE OF ENGINEERING",
  "GOVERNMENT ENGINEERING COLLEGE THRISSUR",
  "GOVERNMENT POLYTECHNIC COLLEGE KUNNAMKULAM",
  "JYOTHI ENGINEERING COLLEGE",
  "NIRMALA COLLEGE OF ARTS AND SCIENCE",
  "NIRMALA COLLEGE OF ENGINEERING",
  "SAHRDAYA COLLEGE OF ENGINEERING & TECHNOLOGY",
  "THEJUS ENGINEERING COLLEGE",
  "VIDYA ACADEMY OF SCIENCE AND TECHNOLOGY",
  "ACE COLLEGE OF ENGINEERING",
  "COLLEGE OF ENGINEERING MUTTATHARA",
  "COLLEGE OF ENGINEERING TRIVANDRUM",
  "LBS INSTITUTE OF TECHNOLOGY FOR WOMEN - POOJAPPURA",
  "LOURDES MATHA COLLEGE OF SCIENCE AND TECHNOLOGY",
  "MAR BASELIOS COLLEGE OF ENGINEERING AND TECHNOLOGY",
  "MARIAN ENGINEERING COLLEGE",
  "Mohandas College of Engineering and Technology",
  "Muslim Association College of Engineering",
  "RAJADHANI INSTITUTE OF ENGINEERING AND TECHNOLOGY",
  "SREE CHITRA THIRUNAL COLLEGE OF ENGINEERING",
  "ST. THOMAS INSTITUTE FOR SCIENCE & TECHNOLOGY",
  "TRINITY COLLEGE OF ENGINEERING",
  "UNIVERSITY COLLEGE OF ENGINEERING KARIAVATTOM",
  "WMO ARTS AND SCIENCE COLLEGE",
  "Model Engineering College",
  "Other",
].sort((a, b) => {
  // Keep "Other" last, sort rest alphabetically
  if (a === "Other") return 1;
  if (b === "Other") return -1;
  return a.localeCompare(b);
});

export const ELIMINATED_TEAMS = ["Croatia", "Netherlands", "Uruguay", "Belgium"];

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

export const AVAILABLE_TEAMS = Object.keys(TEAM_FLAGS).filter(
  (team) => !ELIMINATED_TEAMS.includes(team)
);

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
  0, // Level 1
  800, // Level 2
  1200, // Level 3
  1800, // Level 4
  2600, // Level 5
  3000, // Level 6
  3500, // Level 7
  4000, // Level 8
  4500, // Level 9
  5000, // Level 10
  5500, // Level 11
  6000, // Level 12
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
    xpPercent:
      nextXp > 0
        ? Math.min(Math.round((currentLevelXp / nextXp) * 100), 100)
        : 100,
  };
};

export const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.ru",
  "temp-mail.io",
  "10minutemail.com",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "getairmail.com",
  "burnermail.io",
  "maildrop.cc",
  "trashmail.com",
  "moakt.com",
  "fakeinbox.com",
  "generator.email",
  "tempmailo.com",
  "tempmail.dev",
  "shortmail.com",
  "inboxkitten.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.to",
  "jetable.org",
  "discard.email",
  "teleworm.us",
  "superrito.com",
  "melgard.me",
  "boun.cr",
  "duck.com",
  "mailnull.com",
  "mohmal.com",
  "crazymailing.com",
  "throwawaymail.com",
  "owlymail.com",
  "zillamail.com",
  "getnada.com",
  "disroot.org",
];
