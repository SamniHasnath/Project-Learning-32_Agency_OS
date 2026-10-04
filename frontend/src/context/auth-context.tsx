"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler, tokenStore } from "@/lib/api";
import { AuthApi, SettingsApi, type SettingsInput } from "@/services/agency-api";
import type { Agency, User } from "@/types/models";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User; agency: Agency };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { agencyName: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateAgency: (data: SettingsInput) => Promise<Agency>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ status: "anonymous" });
  }, []);

  // Restore the session from a stored token (localStorage only exists in the browser).
  useEffect(() => {
    setUnauthorizedHandler(logout);
    let cancelled = false;
    Promise.resolve(tokenStore.get())
      .then((token) => (token ? AuthApi.me() : null))
      .then((session) => {
        if (cancelled) return;
        setState(session ? { status: "authenticated", user: session.user, agency: session.agency } : { status: "anonymous" });
      })
      .catch(() => !cancelled && logout());
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await AuthApi.login(email, password);
    tokenStore.set(session.accessToken);
    setState({ status: "authenticated", user: session.user, agency: session.agency });
  }, []);

  const register = useCallback(async (data: { agencyName: string; name: string; email: string; password: string }) => {
    const session = await AuthApi.register(data);
    tokenStore.set(session.accessToken);
    setState({ status: "authenticated", user: session.user, agency: session.agency });
  }, []);

  const updateAgency = useCallback(async (data: SettingsInput) => {
    const agency = await SettingsApi.update(data);
    setState((s) => (s.status === "authenticated" ? { ...s, agency } : s));
    return agency;
  }, []);

  const value = useMemo(() => ({ state, login, register, logout, updateAgency }), [state, login, register, logout, updateAgency]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** For pages inside the authenticated shell, where user/agency are guaranteed. */
export function useSession() {
  const { state } = useAuth();
  if (state.status !== "authenticated") throw new Error("useSession used outside an authenticated page");
  return state;
}
