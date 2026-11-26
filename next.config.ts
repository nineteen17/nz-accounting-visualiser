import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // "A year on the job" moved out of the accounting cycle to its own section (query strings carry through)
  redirects() {
    return [{ source: "/cycle/year", destination: "/on-the-job", permanent: true }];
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
