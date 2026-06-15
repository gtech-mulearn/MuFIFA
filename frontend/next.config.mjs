/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./utils/fonts/**/*", "./public/ticket.png"],
  },
};

export default nextConfig;
