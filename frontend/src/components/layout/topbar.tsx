"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { NavIcon } from "@/components/layout/nav-icon";

type TopbarProps = {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onMenuClick: () => void;
};

export function Topbar({ menuButtonRef, onMenuClick }: TopbarProps) {
  const [openPanel, setOpenPanel] = useState<"notifications" | "profile" | null>(
    null,
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
        onClick={onMenuClick}
        ref={menuButtonRef}
        type="button"
      >
        <NavIcon className="size-5" name="menu" />
      </button>

      <form
        className="relative hidden w-full max-w-md sm:block"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="sr-only" htmlFor="workspace-search">
          Search workspace
        </label>
        <NavIcon
          className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
          name="search"
        />
        <input
          className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          id="workspace-search"
          placeholder="Search your workspace"
          type="search"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            aria-expanded={openPanel === "notifications"}
            aria-label="Notifications"
            className="relative inline-flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() =>
              setOpenPanel((current) =>
                current === "notifications" ? null : "notifications",
              )
            }
            type="button"
          >
            <NavIcon className="size-5" name="notifications" />
            <span
              aria-label="1 unread notification"
              className="absolute right-2 top-2 size-2 rounded-full bg-brand-600 ring-2 ring-white"
            />
          </button>
          {openPanel === "notifications" && (
            <div
              aria-label="Notifications"
              className="absolute right-0 top-12 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
              role="region"
            >
              <p className="text-sm font-semibold text-slate-900">
                Notifications
              </p>
              <p className="mt-2 text-sm text-slate-600">
                You&apos;re all caught up.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            aria-expanded={openPanel === "profile"}
            aria-label="Open account menu"
            className="flex h-10 items-center gap-2 rounded-md px-1.5 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() =>
              setOpenPanel((current) =>
                current === "profile" ? null : "profile",
              )
            }
            type="button"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              AM
            </span>
            <span className="hidden text-sm font-medium text-slate-700 md:block">
              Alex Morgan
            </span>
          </button>
          {openPanel === "profile" && (
            <div
              aria-label="Account menu"
              className="absolute right-0 top-12 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
              role="region"
            >
              <p className="px-3 py-2 text-xs text-slate-500">
                alex@northstarcreative.com
              </p>
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-600"
                href="/settings"
                onClick={() => setOpenPanel(null)}
              >
                Workspace settings
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
