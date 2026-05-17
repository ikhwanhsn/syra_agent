"use client";

import React from "react";
import Image from "next/image";

export function NavbarLogo() {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <span className="text-lg font-bold tracking-tight neon-text sm:text-xl">
        SYRA
      </span>
    );
  }
  return (
    <Image
      src="/logo.jpg"
      alt="Syra"
      width={40}
      height={40}
      className="h-9 w-9 shrink-0 rounded-lg object-cover sm:h-10 sm:w-10"
      priority
      onError={() => setFailed(true)}
    />
  );
}
