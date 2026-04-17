import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { ToasterThemed } from "@/components/ToasterThemed";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ogImage = "https://www.syraa.fun/images/og-banner.png";

export const metadata: Metadata = {
  title: "Staking dApp | SPL Token Staking",
  description: "Stake your SPL tokens and earn rewards.",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Staking dApp | SPL Token Staking",
    description: "Stake your SPL tokens and earn rewards.",
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
    title: "Staking dApp | SPL Token Staking",
    description: "Stake your SPL tokens and earn rewards.",
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("staking-theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=t==="light"||t==="dark"?t:(d?"dark":"light");document.documentElement.classList.toggle("dark",r==="dark");})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <ToasterThemed />
        </Providers>
      </body>
    </html>
  );
}
