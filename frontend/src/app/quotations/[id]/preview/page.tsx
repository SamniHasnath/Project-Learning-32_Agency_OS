import { QuotationPreview } from "@/components/workspace/workspace-ui";
import { getRecord } from "@/services/workspace";

export default async function QuotationPreviewPage({ params }: PageProps<"/quotations/[id]/preview">) {
  const { id } = await params;
  return <QuotationPreview record={getRecord("quotations", id)} />;
}
