"use client";

import React from "react";
import Image from "next/image";

export function NavbarLogo() {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <span className="text-xl font-bold text-foreground">Syra</span>;
  }
  return (
    <Image
      src="/logo.jpg"
      alt="Syra Staking"
      width={140}
      height={36}
      className="h-9 w-auto object-contain"
      style={{ width: "auto" }}
      priority
      onError={() => setFailed(true)}
    />
  );
}
