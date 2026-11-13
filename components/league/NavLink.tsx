"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function active(pathname: string, href: string, also: string[]) {
  return [href, ...also].some((item) => isActive(pathname, item));
}

/** Desktop item in the navy bar. Icons stay in the server tree and are passed as children. */
export function TopNavLink({ href, also = [], children }: { href: string; also?: string[]; children: ReactNode }) {
  const pathname = usePathname();
  const on = active(pathname, href, also);
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={cx(
        "flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors lg:px-3",
        on ? "bg-white text-navy shadow-xs" : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}

/** Phone tab. The icon is server-rendered; the active state highlights with a crisp capsule. */
export function BottomNavLink({ href, also = [], label, icon }: { href: string; also?: string[]; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  const on = active(pathname, href, also);
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={cx(
        "relative flex h-15 flex-col items-center justify-center gap-0.5 text-[11px] font-bold tracking-wide transition-colors",
        on ? "text-turf-dark [&_svg]:stroke-[2.25]" : "text-slate-600 hover:text-navy active:text-navy",
      )}
    >
      <span className={cx("flex h-7 w-12 items-center justify-center rounded-full transition-colors", on ? "bg-turf-light text-turf-dark" : "text-slate-600")}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
