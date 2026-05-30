/**
 * React Router compatibility layer.
 * Keeps the familiar `to`-based Link/NavLink API used across ported pages.
 */

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate as RouterNavigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export { Outlet, useNavigate, useLocation, useParams };

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useRouterSearchParams();
  const setSearchParams = (next: URLSearchParams | Record<string, string>) => {
    const sp =
      next instanceof URLSearchParams
        ? next
        : new URLSearchParams(Object.entries(next).map(([k, v]) => [k, v]));
    const q = sp.toString();
    navigate(q ? `${location.pathname}?${q}` : location.pathname, { replace: false });
  };
  return [params, setSearchParams];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, children, className, ...rest },
  ref,
) {
  const isExternal =
    to.startsWith("http://") || to.startsWith("https://") || to.startsWith("mailto:");
  if (isExternal) {
    return (
      <a href={to} className={className} ref={ref} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={to} replace={replace} className={className} ref={ref} {...rest}>
      {children}
    </RouterLink>
  );
});

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  return <RouterNavigate to={to} replace={replace} />;
}

export type NavLinkRenderProps = { isActive: boolean; isPending: boolean };

export function isNavLinkActive(pathname: string, to: string, end?: boolean): boolean {
  if (end) {
    return pathname === to || pathname === `${to}/`;
  }
  return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
}

export function useNavLinkActive(to: string, end?: boolean): NavLinkRenderProps {
  const { pathname } = useLocation();
  return { isActive: isNavLinkActive(pathname, to, end), isPending: false };
}

function resolveNavLinkRenderProp<T>(
  value: T | ((props: NavLinkRenderProps) => T) | undefined,
  renderProps: NavLinkRenderProps,
): T | undefined {
  if (typeof value === "function") {
    return (value as (props: NavLinkRenderProps) => T)(renderProps);
  }
  return value;
}

export type NavLinkProps = Omit<ComponentProps<typeof Link>, "children" | "className"> & {
  end?: boolean;
  className?: string | ((props: NavLinkRenderProps) => string);
  children?: ReactNode | ((props: NavLinkRenderProps) => ReactNode);
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, className, children, end, ...rest },
  ref,
) {
  const renderProps = useNavLinkActive(to, end);
  const resolvedClass = resolveNavLinkRenderProp(className, renderProps);
  const resolvedChildren = resolveNavLinkRenderProp(children, renderProps);
  return (
    <Link to={to} className={resolvedClass} ref={ref} {...rest}>
      {resolvedChildren}
    </Link>
  );
});
