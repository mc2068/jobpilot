import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Search, User } from "lucide-react";

import { NavbarLink } from "@/components/layout/NavbarLink";
import { DASHBOARD_PATH, FIND_JOBS_PATH, PROFILE_PATH } from "@/lib/routes";

const NAV_LINKS = [
  { label: "Dashboard", href: DASHBOARD_PATH, Icon: LayoutGrid },
  { label: "Find Jobs", href: FIND_JOBS_PATH, Icon: Search },
  { label: "Profile", href: PROFILE_PATH, Icon: User },
];

export function Navbar() {
  return (
    <header className="border-b border-border bg-surface px-6">
      <div className="flex h-16 items-center justify-between">
        <Link href={DASHBOARD_PATH} aria-label="JobPilot dashboard">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={124}
            height={42}
            loading="eager"
          />
        </Link>

        <nav className="flex h-full items-stretch gap-2">
          {NAV_LINKS.map(({ label, href, Icon }) => (
            <NavbarLink
              key={href}
              href={href}
              label={label}
              icon={<Icon className="size-4" />}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
