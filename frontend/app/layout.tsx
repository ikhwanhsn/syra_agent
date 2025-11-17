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

export const metadata: Metadata = {
  title: "Syra Agent",
  description:
    "Syra is a modern, open-source platform for building and deploying AI applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://syraa.fun/images/logo.jpg" />
        <meta
          property="og:description"
          content="Trading signal creation with x402 payments"
        />

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
