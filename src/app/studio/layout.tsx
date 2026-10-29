import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Patent Readiness Studio — USPTO Demo",
  description: "Readiness checks and examiner tools for patent applications",
  robots: "noindex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/tokens_5485.css" />
        <link rel="stylesheet" href="/css/components_a1cb.css" />
        <link rel="stylesheet" href="/css/uspto_ae85.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
