"use client";

import { useRouter } from "next/navigation";
import { Card, PageHeading } from "@/components/ui/primitives";
import { ClientForm } from "@/features/clients/client-form";

export default function NewClientPage() {
  const router = useRouter();
  return (
    <>
      <PageHeading title="Add a client" description="Client details auto-fill into new quotations and invoices." back={{ href: "/clients", label: "All clients" }} />
      <Card className="max-w-3xl">
        <ClientForm onSaved={(c) => router.push(`/clients/${c.id}`)} onCancel={() => router.push("/clients")} />
      </Card>
    </>
  );
}
