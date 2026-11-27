import type { MetadataRoute } from "next";

// Lets the site be installed to a phone's home screen. Paths are relative to this file,
// so they work both at the site root and under /<repo-name>/ on GitHub Pages.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kōwhai Café – Learn NZ Accounting",
    short_name: "Kōwhai Café",
    description: "Learn accounting through a year in a small New Zealand café. Works offline once installed.",
    start_url: "./",
    scope: "./",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#f7c948",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
