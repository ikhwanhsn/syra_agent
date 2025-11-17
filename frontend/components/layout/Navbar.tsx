"use client";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const WalletMultiButtonDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Signals",
    href: "/signals",
  },
  {
    name: "Insight",
    href: "/insight",
  },
  {
    name: "Leaderboard",
    href: "/leaderboard",
  },
  {
    name: "Profile",
    href: "/profile",
  },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="z-50 flex items-center justify-between text-center w-full bg-gray-900 h-18 fixed top-0 left-0 right-0">
      <div className="z-50 flex items-center justify-between text-center max-w-7xl mx-3 xl:mx-auto h-18 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <Link href={"/"} className="flex items-center gap-3">
            <Image
              src="/images/logo.jpg"
              alt="Syra"
              width={100}
              height={100}
              className="h-10 w-10 rounded-full"
            />
            <h1 className="text-2xl font-bold text-white -mt-1">Syra</h1>
          </Link>
          <div className="items-center gap-5 ml-5 hidden md:flex">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`hover:text-white ${
                  link.href !== pathname ? "text-gray-500" : "text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <WalletModalProvider>
            <WalletMultiButtonDynamic />
          </WalletModalProvider>
        </div>
        {isMenuOpen ? (
          <X
            className="h-6 w-6 text-white cursor-pointer md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        ) : (
          <Menu
            className="h-6 w-6 text-white cursor-pointer md:hidden"
            onClick={() => setIsMenuOpen(true)}
          />
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-18 left-0 right-0 w-full bg-gray-900 border-t border-gray-800 shadow-lg z-50 transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-5 p-6">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-lg hover:text-white transition-colors ${
                link.href !== pathname
                  ? "text-gray-400"
                  : "text-white font-semibold"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-800">
            <WalletModalProvider>
              <WalletMultiButtonDynamic />
            </WalletModalProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
