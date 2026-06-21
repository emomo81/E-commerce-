import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A parent folder also has a lockfile; pin this project as the workspace root.
  turbopack: {
    root: import.meta.dirname,
  },
  // Product placeholder photos are fetched from loremflickr (same as the prototype).
  // Using a plain <img> in components, but allow the host here for any future next/image use.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "loremflickr.com" },
    ],
  },
};

export default nextConfig;
