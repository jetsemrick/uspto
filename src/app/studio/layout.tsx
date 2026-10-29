import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patent Readiness Studio — USPTO Demo",
  description: "Readiness checks and examiner tools for patent applications",
  robots: "noindex",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
        precedence="default"
      />
      <link rel="stylesheet" href="/css/tokens_5485.css" precedence="default" />
      <link rel="stylesheet" href="/css/components_a1cb.css" precedence="default" />
      <link rel="stylesheet" href="/css/uspto_ae85.css" precedence="default" />
      {children}
    </>
  );
}
