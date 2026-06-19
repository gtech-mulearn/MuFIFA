import { getSEOMetadata } from "@/utils/seo";

export const metadata = getSEOMetadata({
  title: "Kuzhiundo Leaderboard",
  description:
    "Kerala's premier crowd-sourced pothole mapping mission. Earn recognition and µPoints by reporting road hazards on Kuzhiundo.",
  url: "/kuzhiundo",
  ogImage: "/challenges/kuzhiundo/kuzhiundo_bg.webp",
});

export default function KuzhiundoLayout({ children }) {
  return children;
}
