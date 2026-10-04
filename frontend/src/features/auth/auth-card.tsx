"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Alert, buttonClass, Field } from "@/components/ui/primitives";
import { AgencyOsLogo } from "@/components/ui/agency-os-logo";
import { useAuth } from "@/context/auth-context";
import { errorMessage } from "@/lib/api";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <AgencyOsLogo size="md" showSubtitle />
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </main>
  );
}

/** Where to go after signing in: the page the user was sent away from, if it's a safe local path. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await login(String(data.get("email")), String(data.get("password")));
      router.replace(nextPath());
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to your agency workspace."
      footer={
        <>
          New to Agency OS?{" "}
          <Link href="/register" className="font-semibold">
            Create an agency account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input className="form-input" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <input className="form-input" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={`${buttonClass.primary} w-full`} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== String(data.get("confirm"))) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        agencyName: String(data.get("agencyName")),
        name: String(data.get("name")),
        email: String(data.get("email")),
        password,
      });
      router.replace("/settings?welcome=1");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your agency"
      subtitle="You'll get a private workspace with starter quotation and invoice templates."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Agency name" required>
          <input className="form-input" name="agencyName" required maxLength={120} autoComplete="organization" />
        </Field>
        <Field label="Your name" required>
          <input className="form-input" name="name" required maxLength={120} autoComplete="name" />
        </Field>
        <Field label="Work email" required>
          <input className="form-input" name="email" type="email" required autoComplete="email" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required hint="At least 8 characters">
            <input className="form-input" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" required>
            <input className="form-input" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
        </div>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={`${buttonClass.primary} w-full`} disabled={busy}>
          {busy ? "Creating workspace…" : "Create agency account"}
        </button>
      </form>
    </AuthShell>
  );
}
