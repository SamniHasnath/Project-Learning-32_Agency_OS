"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/primitives";
import { errorMessage } from "@/lib/api";

/**
 * Preview / Download PDF / Print. The PDF is fetched with the user's token and
 * opened as a blob, since the endpoint requires authentication.
 */
export function PdfActions({
  number,
  previewHref,
  loadPdf,
  layout = "row",
}: {
  number: string;
  previewHref?: string;
  loadPdf: () => Promise<Blob>;
  layout?: "row" | "column";
}) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: "download" | "print") {
    setBusy(mode);
    setError(null);
    // Open the tab synchronously (inside the click) so pop-up blockers allow it.
    const tab = mode === "print" ? window.open("", "_blank") : null;
    try {
      const blob = await loadPdf();
      const url = URL.createObjectURL(blob);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${number}.pdf`;
        a.click();
      } else if (tab) {
        tab.location.href = url; // the browser PDF viewer has a print button; print() is triggered where supported
      } else {
        window.open(url, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      tab?.close();
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={layout === "column" ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
      {previewHref && (
        <Link href={previewHref} className={buttonClass.secondary}>
          Preview
        </Link>
      )}
      <button type="button" className={buttonClass.secondary} disabled={busy !== null} onClick={() => run("download")}>
        {busy === "download" ? "Preparing…" : "Download PDF"}
      </button>
      <button type="button" className={buttonClass.secondary} disabled={busy !== null} onClick={() => run("print")}>
        {busy === "print" ? "Opening…" : "Open PDF to print"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
