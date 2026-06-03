// src/app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import MegaMenu from "@/components/layout/MegaMenu";
import SearchModal from "@/components/layout/SearchModal";

import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ScrollToTopOnRouteChange from "@/components/layout/ScrollToTopOnRouteChange";

import { CartDrawer } from "./cart/CartDrawer";

import { BRAND } from "@/config/brand.config";

import { Toaster } from "sonner";

// Observability
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const googleSans = localFont({
  src: "../fonts/GoogleSansFlex.ttf",
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AE Naturals | Nature’s Finest Products",
  description:
    "Premium natural products crafted for wellness, skincare, haircare, and everyday healthy living.",

  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],

    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${googleSans.variable} font-sans antialiased`}
        style={{
          ["--primary" as string]: BRAND.theme.primary,
          ["--secondary" as string]: BRAND.theme.secondary,
          ["--accent" as string]: BRAND.theme.accent,
        }}
      >
        <ScrollToTopOnRouteChange />
        <QueryProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              {/* Global Components */}
              <SearchModal />
              <CartDrawer />

             {/* 🔥 FIX: Mobile drawer sits at the absolute root. It will NEVER be trapped by header CSS again. */}
              <MegaMenu variant="mobile" />

              {/* 🔥 FIX: Header ONLY receives the desktop variant. */}
              <Header megaMenu={<MegaMenu variant="desktop" />} />
              {/* Main Content */}
              <main className="flex flex-1 flex-col w-full">
                <Toaster position="top-center" richColors />
                {children}
              </main>

              {/* Footer */}
              <Footer />
            </div>
          </AuthProvider>
        </QueryProvider>

        {/* Vercel Observability */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}