"use client";

import { useState } from "react";
import { DataTable } from "@/components/tables/data-table";
import { buttonClass, Card, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { ProjectForm } from "@/features/projects/project-form";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { ProjectsApi } from "@/services/agency-api";
import type { Project } from "@/types/models";

export default function ProjectsPage() {
  const { agency } = useSession();
  const { data, error, loading, reload } = useApi(() => ProjectsApi.list(), []);
  const [creating, setCreating] = useState(false);
  const newButton = (
    <button type="button" className={buttonClass.primary} onClick={() => setCreating(true)}>
      + New project
    </button>
  );

  return (
    <>
      <PageHeading title="Projects" description="Group quotations and invoices by engagement." actions={!creating ? newButton : undefined} />
      {creating && (
        <Card title="New project" className="mb-5 max-w-3xl">
          <ProjectForm
            onSaved={() => {
              setCreating(false);
              void reload();
            }}
            onCancel={() => setCreating(false)}
          />
        </Card>
      )}
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DataTable<Project>
          rows={data ?? []}
          rowHref={(p) => `/projects/${p.id}`}
          searchText={(p) => `${p.name} ${p.client?.name ?? ""} ${p.client?.company ?? ""}`}
          statusOf={(p) => p.status}
          statuses={["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]}
          empty={{ title: "No projects yet", description: "Projects are optional — use them to group documents.", action: newButton }}
          columns={[
            { header: "Project", sortValue: (p) => p.name, cell: (p) => <span className="font-semibold">{p.name}</span> },
            { header: "Client", sortValue: (p) => p.client?.company || p.client?.name || "", cell: (p) => p.client?.company || p.client?.name },
            { header: "Status", sortValue: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
            { header: "Budget", align: "right", sortValue: (p) => Number(p.budget), cell: (p) => money(p.budget, agency.currency) },
            { header: "Documents", align: "right", cell: (p) => (p._count?.quotations ?? 0) + (p._count?.invoices ?? 0) },
            { header: "Created", sortValue: (p) => p.createdAt, cell: (p) => date(p.createdAt) },
          ]}
        />
      )}
    </>
  );
}
