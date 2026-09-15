import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: { "/api/clone": ["./drizzle/clone/**/*"], "/api/clone/speech": ["./drizzle/clone/**/*"], "/api/clone/portrait": ["./drizzle/clone/**/*"], "/api/clone/avatar": ["./drizzle/clone/**/*"] },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gstatic.com",
        pathname: "/marketing-cms/assets/images/**",
      },
      {
        protocol: "https",
        hostname: "cdn-dynmedia-1.microsoft.com",
        pathname: "/is/image/microsoftcorp/**",
      },
    ],
  },
};

export default nextConfig;
