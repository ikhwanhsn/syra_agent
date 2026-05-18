import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { ToasterThemed } from "@/components/ToasterThemed";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["300", "400", "500", "600", "700"],
});

const ogImage = "https://www.syraa.fun/images/og-banner.png";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Syra Staking | $SYRA",
  description:
    "Stake $SYRA for the Syra smart intelligence agent for traders—governance, tiers, and protocol rewards on Solana.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Syra Staking | $SYRA",
    description:
      "Stake $SYRA for the Syra smart intelligence agent for traders—governance, tiers, and protocol rewards on Solana.",
    type: "website",
    images: [
      {
        url: ogImage,
        type: "image/png",
        width: 1200,
        height: 628,
        alt: "Syra — Smart Intelligence Agent for Traders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@syra_agent",
    creator: "@syra_agent",
    title: "Syra Staking | $SYRA",
    description:
      "Stake $SYRA for the Syra smart intelligence agent for traders—governance, tiers, and protocol rewards on Solana.",
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
      <body
        className={`${spaceGrotesk.variable} min-h-[100dvh] min-w-0 font-sans antialiased`}
      >
        <Providers>
          {children}
          <ToasterThemed />
        </Providers>
      </body>
    </html>
  );
}
