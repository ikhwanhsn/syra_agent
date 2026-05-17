"use client";

import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: React.ReactNode;
  gradient?: boolean;
  valueClassName?: string;
}

export function StatsCard({
  title,
  value,
  subValue,
  gradient,
  valueClassName,
}: StatsCardProps) {
  const valueTone = gradient ? "font-bold neon-text" : "font-semibold text-foreground";

  return (
    <div className="glass-card flex h-full flex-col p-5 transition duration-300 hover:shadow-glow-sm">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <p
        className={`break-words text-xl leading-snug sm:text-2xl ${valueTone} ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {subValue != null ? (
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {subValue}
        </div>
      ) : null}
    </div>
  );
}
