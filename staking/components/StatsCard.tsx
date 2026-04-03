"use client";

import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: React.ReactNode;
  gradient?: boolean;
  /** Extra classes for the main value (e.g. long dates, small mono). */
  valueClassName?: string;
}

export function StatsCard({
  title,
  value,
  subValue,
  gradient,
  valueClassName,
}: StatsCardProps) {
  const valueTone = gradient
    ? "font-bold text-primary"
    : "font-semibold text-foreground";
  return (
    <div className="card-surface flex h-full flex-col p-5 transition hover:border-primary/30">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
