import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "WaterWatch SJDM",
    short_name: "WaterWatch",
    description: "Community water monitoring platform for San Jose del Monte, Bulacan",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d7abf",
    orientation: "portrait-primary",
    categories: ["utilities", "community"],
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon", purpose: "any" },
    ],
    screenshots: [],
    prefer_related_applications: false,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
