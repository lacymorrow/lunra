import type { Metadata } from "next";
import Script from "next/script";
import type React from "react";
import ClientLayout from "./client-layout"; // Import the ClientLayout
import "./globals.css";

export const metadata: Metadata = {
  title: "lunra - Mindful Goal Achievement",
  description:
    "A gentle path to meaningful progress. Turn aspirations into realities, one thoughtful step at a time.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body>
        {/* Wrap children with ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
        <Script defer src="https://analytics.lacy.sh/script.js" data-website-id="e9c703cb-bc06-483c-b42c-a9a5c4998dd0" />
      </body>
    </html>
  );
}
