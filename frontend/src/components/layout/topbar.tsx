"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { NavIcon } from "@/components/layout/nav-icon";
import { useAuth, useSession } from "@/context/auth-context";

type TopbarProps = {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onMenuClick: () => void;
};

export function Topbar({ menuButtonRef, onMenuClick }: TopbarProps) {
  const { user, agency } = useSession();
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) router.push(`/documents?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        ref={menuButtonRef}
        type="button"
      >
        <NavIcon className="size-5" name="menu" />
      </button>

      <form className="relative hidden w-full max-w-md sm:block" role="search" onSubmit={search}>
        <label className="sr-only" htmlFor="workspace-search">
          Search quotations and invoices
        </label>
        <NavIcon className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" name="search" />
        <input
          className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          id="workspace-search"
          name="q"
          placeholder="Search quotations & invoices (number, title, client)"
          type="search"
        />
      </form>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open account menu"
          className="flex h-10 items-center gap-2 rounded-md px-1.5 text-left hover:bg-slate-100"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{initials}</span>
          <span className="hidden text-sm font-medium text-slate-700 md:block">{user.name}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg" role="menu">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="mt-1 truncate text-xs text-slate-400">{agency.name}</p>
            </div>
            <Link role="menuitem" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/settings" onClick={() => setOpen(false)}>
              Agency settings
            </Link>
            <button
              role="menuitem"
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
