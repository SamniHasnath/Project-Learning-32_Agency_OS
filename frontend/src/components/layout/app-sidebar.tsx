"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "@/components/layout/nav-icon";
import { AgencyOsLogo } from "@/components/ui/agency-os-logo";
import { useSession } from "@/context/auth-context";

type AppSidebarProps = {
  onNavigate?: () => void;
};

type NavigationItem = {
  href: string;
  icon: NavIconName;
  label: string;
};

const primaryNavigation: NavigationItem[] = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/clients", icon: "clients", label: "Clients" },
  { href: "/projects", icon: "projects", label: "Projects" },
  { href: "/documents", icon: "documents", label: "Document overview" },
  { href: "/quotations", icon: "quotations", label: "Quotations" },
  { href: "/invoices", icon: "invoices", label: "Invoices" },
  { href: "/payments", icon: "payments", label: "Payments" },
  { href: "/templates", icon: "templates", label: "Templates" },
];

const secondaryNavigation: NavigationItem[] = [
  { href: "/settings", icon: "settings", label: "Settings" },
];

function NavigationLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
      href={item.href}
      onClick={onNavigate}
    >
      <NavIcon
        className={`size-[18px] shrink-0 ${
          isActive ? "text-brand-600" : "text-slate-500"
        }`}
        name={item.icon}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { agency } = useSession();

  function renderItems(items: NavigationItem[]) {
    return items.map((item) => {
      const isActive =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

      return (
        <li key={item.href}>
          <NavigationLink
            isActive={isActive}
            item={item}
            onNavigate={onNavigate}
          />
        </li>
      );
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
          <AgencyOsLogo size="sm" showSubtitle={true} />
        </Link>
      </div>

      <div className="border-b border-slate-200 px-4 py-4">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </p>
        <p className="mt-1 truncate px-2 text-sm font-medium text-slate-700">
          {agency.name}
        </p>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-3 py-5"
      >
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </p>
        <ul className="space-y-1">{renderItems(primaryNavigation)}</ul>

        <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Preferences
        </p>
        <ul className="space-y-1">{renderItems(secondaryNavigation)}</ul>
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-xs text-slate-500">Agency management workspace</p>
      </div>
    </div>
  );
}
