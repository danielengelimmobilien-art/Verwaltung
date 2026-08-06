"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  GridIcon,
  BuildingIcon,
  UsersIcon,
  WrenchIcon,
  ContactIcon,
  BankIcon,
  FileTextIcon,
} from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch } from "@/components/global-search";

const links = [
  { href: "/", label: "Übersicht", icon: GridIcon },
  { href: "/objekte", label: "Objekte", icon: BuildingIcon },
  { href: "/mieter", label: "Mieter", icon: UsersIcon },
  { href: "/sanierung", label: "Sanierung", icon: WrenchIcon },
  { href: "/kontakte", label: "Kontakte", icon: ContactIcon },
  { href: "/zahlungen", label: "Zahlungen", icon: BankIcon },
  { href: "/textvorlagen", label: "Vorlagen", icon: FileTextIcon },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="h-[2px] w-full brand-underline" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--brand-strong)] shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-bright)] to-[var(--accent)] text-white text-sm font-bold shadow-sm">
            IV
          </span>
          <span className="hidden sm:inline">Immobilien Verwaltung</span>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="w-px h-6 bg-[var(--border)] shrink-0 mx-0.5" />
          <GlobalSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
