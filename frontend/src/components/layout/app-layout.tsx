"use client";

import type { ReactNode, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavIcon } from "@/components/layout/nav-icon";
import { Topbar } from "@/components/layout/topbar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileNavigationOpen = useRef(false);

  useEffect(() => {
    if (isMobileNavigationOpen) {
      closeButtonRef.current?.focus();
    } else if (wasMobileNavigationOpen.current) {
      menuButtonRef.current?.focus();
    }

    wasMobileNavigationOpen.current = isMobileNavigationOpen;
  }, [isMobileNavigationOpen]);

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setIsMobileNavigationOpen(false);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements =
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
    const firstElement = focusableElements.item(0);
    const lastElement = focusableElements.item(focusableElements.length - 1);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        className="sr-only z-50 rounded-md bg-white p-3 text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        href="#main-content"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 lg:block">
        <AppSidebar />
      </aside>

      <div className="min-h-screen lg:pl-64">
        <Topbar
          onMenuClick={() => setIsMobileNavigationOpen(true)}
          menuButtonRef={menuButtonRef}
        />
        <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-7" id="main-content">
          {children}
        </main>
      </div>

      {isMobileNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default bg-slate-950/40"
            onClick={() => setIsMobileNavigationOpen(false)}
            tabIndex={-1}
            type="button"
          />
          <div
            aria-labelledby="mobile-navigation-title"
            aria-modal="true"
            className="relative flex h-full w-[min(20rem,85vw)] flex-col bg-white shadow-xl"
            onKeyDown={handleDrawerKeyDown}
            role="dialog"
          >
            <h2 className="sr-only" id="mobile-navigation-title">
              Navigation menu
            </h2>
            <div className="flex h-16 shrink-0 items-center justify-end border-b border-slate-200 px-3">
              <button
                aria-label="Close navigation menu"
                className="inline-flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                onClick={() => setIsMobileNavigationOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <NavIcon className="size-5" name="close" />
              </button>
            </div>
            <AppSidebar
              onNavigate={() => setIsMobileNavigationOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
