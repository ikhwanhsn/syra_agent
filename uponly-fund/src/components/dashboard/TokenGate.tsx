import type { ReactNode } from "react";

type TokenGateProps = {
  pageTitle: string;
  preview: ReactNode;
  children: ReactNode;
};

export function TokenGate({ pageTitle, preview, children }: TokenGateProps) {
  return (
    <div aria-label={pageTitle} data-preview={Boolean(preview)}>
      {children}
    </div>
  );
}
