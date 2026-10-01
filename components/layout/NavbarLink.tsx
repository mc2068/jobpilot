"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function NavbarLink({ href, label, icon }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex items-center gap-2 px-4 text-sm font-medium transition-colors ${
        isActive
          ? "text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent"
          : "text-text-medium hover:text-accent"
      }`}
    >
      <span className={isActive ? undefined : "text-text-muted"}>{icon}</span>
      {label}
    </Link>
  );
}
