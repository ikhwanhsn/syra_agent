import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Staking dApp | SPL Token Staking",
  description: "Stake your SPL tokens and earn rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(23, 23, 23, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
