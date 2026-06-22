/**
 * Standardized SEO Metadata Generator for Next.js App Router.
 * Generates uniform metadata objects incorporating default values and og:logo configurations.
 *
 * @param {Object} params
 * @param {string|Object} params.title - Page title string, or a Next.js metadata title object.
 * @param {string} [params.description] - Page meta description.
 * @param {string} [params.url] - Relative path for canonical/og URL mapping.
 * @param {string} [params.ogImage] - Path or URL of the social preview banner.
 * @param {boolean} [params.noIndex] - Whether the page should be blocked from crawler indexing.
 * @returns {import('next').Metadata}
 */
export function getSEOMetadata({
  title,
  description = "Build. Compete. Conquer. A gamified experience by µLearn Foundation & µLearn MCE. Complete technical drills, wager μPoints, and lead your squad to victory.",
  url,
  ogImage = "/MMP_Banner.webp",
  noIndex = false,
}) {
  const siteUrl = "https://mufifa.mulearn.org";
  const absoluteUrl = url ? `${siteUrl}${url}` : siteUrl;
  const absoluteOgImage = ogImage.startsWith("http")
    ? ogImage
    : `${siteUrl}${ogImage}`;

  const isTitleObject = typeof title === "object" && title !== null;
  const titleString = isTitleObject
    ? title.default || "µFIFA '26"
    : title || "µFIFA '26";
  const seoTitle = isTitleObject
    ? titleString
    : title
      ? `${title} | µFIFA '26`
      : "µFIFA '26";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: [
      "µFifa",
      "mulearn",
      "gamified",
      "football",
      "fifa",
      "coding",
      "challenges",
      "MCE",
      "sports",
      "tech",
      "squads",
    ],
    authors: [{ name: "Adhwaith A S", url: "https://adhwaithas.dev" }],
    creator: "µLearn Foundation & µLearn MCE",
    publisher: "µLearn MCE",
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    manifest: "/site.webmanifest",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: seoTitle,
      description,
      url: absoluteUrl,
      siteName: "µFIFA '26",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
          alt: titleString,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [absoluteOgImage],
      creator: "@mulearn",
    },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "og:logo": "https://mufifa.mulearn.org/Logos/logo.webp",
    },
  };
}
