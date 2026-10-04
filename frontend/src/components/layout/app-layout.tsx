"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavIcon } from "@/components/layout/nav-icon";
import { Topbar } from "@/components/layout/topbar";
import { LoadingState } from "@/components/ui/primitives";
import { AuthProvider, useAuth } from "@/context/auth-context";

const PUBLIC_ROUTES = ["/login", "/register"];
type AuthStatus = ReturnType<typeof useAuth>["state"]["status"];

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {/* One boundary for every page that reads query params via useSearchParams(). */}
      <Suspense fallback={<FullPageLoader />}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </AuthProvider>
  );
}

/** Public pages render bare; everything else requires a session and gets the app shell. */
function AuthGate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  // How the session first resolved. Someone who arrives already signed in is sent
  // away from /login; someone who just signed in is navigated by the form itself.
  const restoredAs = useRef<AuthStatus | null>(null);

  useEffect(() => {
    if (state.status === "loading") return;
    restoredAs.current ??= state.status;
    if (state.status === "anonymous" && !isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (state.status === "authenticated" && isPublic && restoredAs.current === "authenticated") router.replace("/dashboard");
  }, [state.status, isPublic, pathname, router]);

  if (isPublic) {
    return state.status === "anonymous" ? <>{children}</> : <FullPageLoader />;
  }
  if (state.status !== "authenticated") return <FullPageLoader />;
  return <Shell>{children}</Shell>;
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoadingState />
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
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
    if (event.key !== "Tab") return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        className="sr-only z-50 rounded-md bg-white p-3 text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>

      <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 lg:block">
        <AppSidebar />
      </aside>

      <div className="min-h-screen lg:pl-64 print:pl-0">
        <Topbar onMenuClick={() => setIsMobileNavigationOpen(true)} menuButtonRef={menuButtonRef} />
        <main className="mx-auto w-full max-w-[1600px] p-5 sm:p-7 print:p-0" id="main-content">
          {children}
        </main>
      </div>

      {isMobileNavigationOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
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
                className="inline-flex size-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                onClick={() => setIsMobileNavigationOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <NavIcon className="size-5" name="close" />
              </button>
            </div>
            <AppSidebar onNavigate={() => setIsMobileNavigationOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
