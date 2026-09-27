import type { ReactNode } from "react";

type StatusMessageProps = {
  children: ReactNode;
  tone: "error" | "muted" | "success";
};

const toneClasses: Record<StatusMessageProps["tone"], string> = {
  error: "text-rose-300",
  muted: "text-slate-400",
  success: "text-emerald-300",
};

export function StatusMessage({ children, tone }: StatusMessageProps) {
  return (
    <p
      className={`mt-3 text-sm ${toneClasses[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
