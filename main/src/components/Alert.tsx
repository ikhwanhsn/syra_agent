"use client";

import React from "react";

const icons = {
  error: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const variantStyles = {
  error:
    "border-destructive/40 bg-destructive/10 text-destructive [&_svg]:text-destructive",
  warning:
    "border-warning/40 bg-warning/10 text-warning [&_svg]:text-warning",
  success:
    "border-success/40 bg-success/10 text-success [&_svg]:text-success",
};

export interface AlertProps {
  variant?: "error" | "warning" | "success";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "error",
  title,
  children,
  action,
  className = "",
}: AlertProps) {
  const style = variantStyles[variant];
  const icon = icons[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border px-4 py-3.5 shadow-sm ${style} ${className}`}
    >
      <span className="mt-0.5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-1 font-semibold text-inherit">{title}</p>
        )}
        <div className="text-sm opacity-95 [&_p]:mb-1 [&_p:last-child]:mb-0">
          {children}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
