/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Telegram user profile photos
      { protocol: "https", hostname: "t.me" },
      { protocol: "https", hostname: "cdn4.telegram-cdn.org" },
      { protocol: "https", hostname: "cdn1.telegram-cdn.org" },
    ],
  },
};

export default nextConfig;
