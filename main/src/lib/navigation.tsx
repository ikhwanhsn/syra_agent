"use client";

/**
 * React Router compatibility layer for Next.js App Router.
 * Allows ported Vite pages to keep familiar hooks/components.
 */

import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() ?? "/";
  const searchParams = useNextSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  return {
    pathname,
    search,
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null as unknown,
    key: "default",
  };
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const params = useNextSearchParams();
  const setParams = (next: URLSearchParams | Record<string, string>) => {
    const sp =
      next instanceof URLSearchParams
        ? next
        : new URLSearchParams(Object.entries(next).map(([k, v]) => [k, v]));
    const q = sp.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };
  return [params ?? new URLSearchParams(), setParams];
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useNextParams() as T;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, children, className, ...rest },
  ref
) {
  return (
    <NextLink href={to} replace={replace} className={className} ref={ref} {...rest}>
      {children}
    </NextLink>
  );
});

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  if (typeof window !== "undefined") {
    if (replace) router.replace(to);
    else router.push(to);
  }
  return null;
}

/** Dashboard layout: render Next.js child routes instead of React Router Outlet */
export function Outlet({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export type NavLinkProps = ComponentProps<typeof Link> & {
  className?: string | ((props: { isActive: boolean }) => string);
};

export function NavLink({ to, className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname() ?? "/";
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;
  return (
    <Link to={to} className={resolvedClass} {...rest}>
      {children}
    </Link>
  );
}
