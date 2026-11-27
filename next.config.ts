import type { NextConfig } from "next";

// The whole site is pre-built to plain files in out/, so any static host can serve it
// (GitHub Pages, Vercel, Netlify...). On GitHub Pages the site lives under /<repo-name>,
// so the deploy workflow sets PAGES_BASE_PATH; locally and on Vercel it's empty.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // static export for builds only: in `next dev` it turns unknown slugs into errors instead of 404s
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  basePath,
  // the browser needs the base path to find the offline service worker (out/sw.js)
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  trailingSlash: true,
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
