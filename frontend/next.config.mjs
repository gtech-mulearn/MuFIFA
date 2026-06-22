/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.29.225"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
      {
        protocol: "https",
        hostname: "ncqnqrxchgthpauhtnce.supabase.co",
      },
      {
        protocol: "https",
        hostname: "fayausa.com",
      },
      {
        protocol: "https",
        hostname: "www.zycoz.com",
      },
    ],
  },
};

export default nextConfig;
