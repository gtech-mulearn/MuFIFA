export default function sitemap() {
  const baseUrl = "https://mufifa.mulearn.org";
  
  const routes = ["", "/leaderboard", "/community-guidelines"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route === "" || route === "/leaderboard" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/leaderboard" ? 0.8 : 0.5,
  }));

  return routes;
}
