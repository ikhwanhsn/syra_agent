import { useEffect, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { LINK_UPONLY_APP } from "../../config/global";

type RedirectToUponlyAppProps = {
  /** Path on the Up Only Fund app, e.g. "/uponly/overview" */
  path: string;
};

/**
 * When `LINK_UPONLY_APP` is the placeholder ("/"), sends users to the Syra landing home.
 * When set to the real deploy origin, full-page redirects to that app + `path`.
 */
export function RedirectToUponlyApp({ path }: RedirectToUponlyAppProps): ReactElement {
  const suffix = path.startsWith("/") ? path : `/${path}`;

  useEffect(() => {
    if (LINK_UPONLY_APP === "/") {
      return;
    }
    const base = LINK_UPONLY_APP.replace(/\/$/, "");
    window.location.replace(`${base}${suffix}`);
  }, [suffix]);

  if (LINK_UPONLY_APP === "/") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}
