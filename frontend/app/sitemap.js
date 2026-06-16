export default function sitemap() {
  const baseUrl = "https://mufifa.mulearn.org";

  const routes = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/leaderboard", changeFrequency: "daily", priority: 0.9 },
    { path: "/match", changeFrequency: "daily", priority: 0.8 },
    { path: "/register", changeFrequency: "weekly", priority: 0.8 },
    { path: "/community-guidelines", changeFrequency: "monthly", priority: 0.5 },
    { path: "/login", changeFrequency: "monthly", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
