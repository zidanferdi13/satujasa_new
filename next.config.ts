import type { NextConfig } from "next";

/**
 * Dev-only: hosts allowed to load `/_next/*` and HMR resources from another origin.
 * Next 16 blocks cross-origin dev requests by default, which breaks the app when it is opened
 * through a LAN or Tailscale address instead of localhost. Production builds ignore this list.
 *
 * More hosts without editing this file: NEXT_ALLOWED_DEV_ORIGINS="host1,host2".
 */
const devOrigins = [
  "100.85.250.59",
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",").map((host) => host.trim()) ?? []),
].filter(Boolean);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: false,
  allowedDevOrigins: devOrigins,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
