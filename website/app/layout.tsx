import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statelite — State that fits anywhere",
  description:
    "A tiny, type-safe, framework-agnostic state store for TypeScript with reactive selectors and pluggable persistence.",
  keywords: [
    "TypeScript",
    "state management",
    "React",
    "Vue",
    "Svelte",
    "Angular",
    "framework agnostic",
  ],
  authors: [{ name: "Lelianto", url: "https://github.com/Lelianto" }],
  openGraph: {
    title: "Statelite — State that fits anywhere",
    description:
      "A tiny, type-safe state store that stays out of your framework.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statelite — State that fits anywhere",
    description:
      "Framework-agnostic. Type-safe. Zero runtime dependencies.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
