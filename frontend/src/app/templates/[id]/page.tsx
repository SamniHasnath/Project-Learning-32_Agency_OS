"use client";

import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/ui/primitives";
import { TemplateEditor } from "@/features/templates/template-editor";
import { useApi } from "@/hooks/use-api";
import { TemplatesApi } from "@/services/agency-api";

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useApi(() => TemplatesApi.get(id), [id]);
  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Template not found"} onRetry={reload} />;
  return <TemplateEditor key={data.id} initial={data} onSaved={setData} />;
}
