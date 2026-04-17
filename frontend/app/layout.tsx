import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SolanaProvider } from "@/components/SolanaProvider";
import "@solana/wallet-adapter-react-ui/styles.css";
import toast, { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ogImage = "https://www.syraa.fun/images/og-banner.png";

export const metadata: Metadata = {
  title: "Syra Agent",
  description:
    "Syra is a modern, open-source platform for building and deploying AI applications.",
  openGraph: {
    title: "Syra Agent",
    description:
      "Syra is a modern, open-source platform for building and deploying AI applications.",
    type: "website",
    images: [
      {
        url: ogImage,
        type: "image/png",
        width: 1200,
        height: 628,
        alt: "Syra — AI Trading Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@syra_agent",
    creator: "@syra_agent",
    title: "Syra Agent",
    description:
      "Syra is a modern, open-source platform for building and deploying AI applications.",
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SolanaProvider>{children}</SolanaProvider>
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
