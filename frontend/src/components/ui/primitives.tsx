"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { titleCase } from "@/lib/format";

export const buttonClass = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600",
  ghost: "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50",
};

export function PageHeading({
  title,
  description,
  eyebrow = "Workspace",
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="no-print mb-7">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex text-sm font-medium text-slate-500 hover:text-brand-700">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-700">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-500/15",
  SENT: "bg-blue-50 text-blue-700 ring-blue-700/15",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800 ring-amber-600/20",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-700/15",
  PLANNING: "bg-violet-50 text-violet-700 ring-violet-600/15",
  LEAD: "bg-violet-50 text-violet-700 ring-violet-600/15",
  ON_HOLD: "bg-amber-50 text-amber-800 ring-amber-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/15",
  OVERDUE: "bg-rose-50 text-rose-700 ring-rose-600/15",
  EXPIRED: "bg-orange-50 text-orange-700 ring-orange-600/20",
  VOID: "bg-slate-100 text-slate-500 line-through ring-slate-400/20",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-400/20",
  INACTIVE: "bg-slate-100 text-slate-500 ring-slate-400/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_TONE[status] ?? STATUS_TONE.DRAFT}`}>
      {titleCase(status)}
    </span>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info" | "warning"; children: ReactNode }) {
  const tones = {
    error: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-sm font-semibold text-rose-700">Couldn&apos;t load this page</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${buttonClass.secondary} mt-4`}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400" aria-hidden="true">
        ⌕
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, hint, tone = "brand" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "brand" | "green" | "amber" | "blue" | "rose" }) {
  const dot = { brand: "bg-brand-600", green: "bg-emerald-500", amber: "bg-amber-500", blue: "bg-blue-500", rose: "bg-rose-500" }[tone];
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </article>
  );
}

/** A button that asks for inline confirmation before running a destructive action. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  variant = "danger",
  disabled,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: keyof typeof buttonClass;
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) {
    return (
      <button type="button" className={buttonClass[variant]} disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-700">{confirmLabel}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass.danger}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
              setAsking(false);
            }
          }}
        >
          {busy ? "Working…" : "Confirm"}
        </button>
        <button type="button" className={buttonClass.secondary} disabled={busy} onClick={() => setAsking(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DescriptionList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-1 whitespace-pre-line break-words text-sm font-medium text-slate-800">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
