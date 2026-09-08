import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/login",
        permanent: false,
      },
      {
        source: "/admin/management",
        destination: "/admin/management/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
