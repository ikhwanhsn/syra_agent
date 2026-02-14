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
    <div className="card-surface p-5 transition hover:border-primary/30">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p
        className={
          gradient
            ? "text-2xl font-bold text-primary"
            : "text-2xl font-bold text-foreground"
        }
      >
        {value}
      </p>
      {subValue && (
        <p className="mt-1 text-sm text-muted-foreground">{subValue}</p>
      )}
    </div>
  );
}
