"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, buttonClass, Card, ErrorState, LoadingState, PageHeading } from "@/components/ui/primitives";
import { useApi } from "@/hooks/use-api";
import { errorMessage } from "@/lib/api";
import { date } from "@/lib/format";
import { TemplatesApi } from "@/services/agency-api";
import type { DocumentTemplate, DocumentType } from "@/types/models";

export default function TemplatesPage() {
  const { data, error, loading, reload } = useApi(() => TemplatesApi.list(), []);
  const [actionError, setActionError] = useState<string | null>(null);

  async function makeDefault(id: string) {
    setActionError(null);
    try {
      await TemplatesApi.setDefault(id);
      await reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  }

  const group = (type: DocumentType) => (data ?? []).filter((t) => t.type === type);

  return (
    <>
      <PageHeading
        title="Document templates"
        description="Reusable layouts and branding for quotations and invoices. Issued documents keep the template version they were created with."
        actions={
          <Link href="/templates/new" className={buttonClass.primary}>
            + New template
          </Link>
        }
      />
      {actionError && (
        <div className="mb-5">
          <Alert>{actionError}</Alert>
        </div>
      )}
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          {(["QUOTATION", "INVOICE"] as const).map((type) => (
            <Card key={type} title={type === "QUOTATION" ? "Quotation templates" : "Invoice templates"}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group(type).map((t) => (
                  <TemplateCard key={t.id} template={t} onMakeDefault={() => makeDefault(t.id)} />
                ))}
                {group(type).length === 0 && <p className="text-sm text-slate-500">No templates yet — documents use the built-in layout.</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function TemplateCard({ template: t, onMakeDefault }: { template: DocumentTemplate; onMakeDefault: () => void }) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-200 p-4">
      <div className="flex h-20 items-end rounded-md p-3 text-white" style={{ background: `linear-gradient(135deg, ${t.branding.primaryColor}, ${t.branding.accentColor})` }}>
        <span className="text-lg font-bold tracking-wide" style={{ fontFamily: t.branding.fontFamily === "Times-Roman" ? "Times New Roman, serif" : t.branding.fontFamily === "Courier" ? "Courier New, monospace" : "Helvetica, Arial, sans-serif" }}>
          {t.layout.title}
        </span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/templates/${t.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
            {t.name}
          </Link>
          <p className="text-xs text-slate-500">
            v{t.version} · updated {date(t.updatedAt)} · {t.layout.sections.filter((s) => s.visible).length} sections
          </p>
        </div>
        {t.isDefault && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Default</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/templates/${t.id}`} className={buttonClass.secondary}>
          Edit
        </Link>
        {!t.isDefault && (
          <button type="button" className={buttonClass.secondary} onClick={onMakeDefault}>
            Make default
          </button>
        )}
      </div>
    </article>
  );
}
