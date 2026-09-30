import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Condition", href: "#" },
];

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-6 border-t border-border-light py-10 sm:h-[131px] sm:flex-row sm:justify-between sm:py-0 sm:pr-14 sm:pl-9">
      <Link href="/" aria-label="JobPilot home">
        <Image src="/logo.png" alt="JobPilot" width={124} height={42} />
      </Link>
      <nav className="flex flex-wrap justify-center gap-8">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-base text-text-darker transition-colors hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
