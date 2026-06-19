/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.29.225"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
