import type { Metadata } from "next";
import type React from "react";
import ClientLayout from "./client-layout"; // Import the ClientLayout

import { AuthProvider } from "@/contexts/auth-context"
import { GoalDataProvider } from "@/contexts/goal-data-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

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
      <head>
        <script async src="https://js.stripe.com/v3/"></script>
      </head>
      <body>
        {/* Wrap children with ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
