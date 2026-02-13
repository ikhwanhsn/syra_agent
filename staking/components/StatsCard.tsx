"use client";

import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  gradient?: boolean;
}

export function StatsCard({ title, value, subValue, gradient }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-white/15">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <p
        className={
          gradient
            ? "bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent"
            : "text-2xl font-bold text-white"
        }
      >
        {value}
      </p>
      {subValue && (
        <p className="mt-1 text-sm text-zinc-400">{subValue}</p>
      )}
    </div>
  );
}
