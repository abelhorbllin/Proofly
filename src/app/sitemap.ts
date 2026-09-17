import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://adintel.app";
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/pricing`, priority: 0.8 },
    { url: `${base}/login`, priority: 0.3 },
    { url: `${base}/signup`, priority: 0.5 },
  ];
}
