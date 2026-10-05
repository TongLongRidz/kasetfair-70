import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/staff",
        destination: "/staff/login",
        permanent: false,
      },
      {
        source: "/staff/management",
        destination: "/staff/management/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
