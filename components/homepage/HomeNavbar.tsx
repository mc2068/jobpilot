import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Find Jobs", href: "/find-jobs" },
  { label: "Profile", href: "/profile" },
];

export function HomeNavbar() {
  return (
    <header className="border-b border-border-light bg-surface px-4 xl:px-0">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between">
        <Link href="/" aria-label="JobPilot home" className="-ml-[3px]">
          <Image
            src="/logo.png"
            alt="JobPilot"
            width={124}
            height={42}
            loading="eager"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:ml-5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base text-text-darker transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-md border border-text-slate-medium bg-text-slate px-[19px] py-2 text-[15px] leading-6 text-surface transition-opacity hover:opacity-90"
        >
          Start for free
        </Link>
      </div>
    </header>
  );
}
