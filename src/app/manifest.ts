import type { MetadataRoute } from "next";

// Gjer at appen kan leggjast til på heimskjermen på mobil
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NiceToKnow",
    short_name: "NiceToKnow",
    description: "Rabattkodar, medlemskap, forsikringar og anna kjekt å vite.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4fbf8",
    theme_color: "#006b5f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
