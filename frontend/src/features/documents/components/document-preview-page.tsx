"use client";

import Link from "next/link";
import { buttonClass, ErrorState, LoadingState } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { DocumentRenderer, type RenderableDocument } from "./document-renderer";
import { PdfActions } from "./pdf-actions";

/** Full-width preview with print (browser) and PDF (server-rendered) options. */
export function DocumentPreviewPage<T extends { number: string }>({
  load,
  toRenderable,
  backHref,
  loadPdf,
  deps,
}: {
  load: () => Promise<T>;
  toRenderable: (doc: T) => RenderableDocument;
  backHref: string;
  loadPdf: () => Promise<Blob>;
  deps: unknown[];
}) {
  const { data, error, loading, reload } = useApi(load, deps);
  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Document not found"} onRetry={reload} />;

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm font-medium text-slate-500 hover:text-brand-700">
          ← Back to {data.number}
        </Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass.primary} onClick={() => window.print()}>
            Print
          </button>
          <PdfActions number={data.number} loadPdf={loadPdf} />
        </div>
      </div>
      <DocumentRenderer doc={toRenderable(data)} />
    </>
  );
}
