import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Roboto er skrifta til Material Design
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NiceToKnow",
  description: "Rabattkodar, medlemskap, forsikringar og anna kjekt å vite – samla på éin stad.",
  // Privat app: hald han ute av søkjemotorar
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4fbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1513" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nn" className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
