"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { buttonClass, Card, DescriptionList, ErrorState, LoadingState, PageHeading, StatusBadge } from "@/components/ui/primitives";
import { useSession } from "@/context/auth-context";
import { ProjectForm } from "@/features/projects/project-form";
import { useApi } from "@/hooks/use-api";
import { date, money } from "@/lib/format";
import { ProjectsApi } from "@/services/agency-api";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { agency } = useSession();
  const { data: p, error, loading, reload } = useApi(() => ProjectsApi.get(id), [id]);
  const [editing, setEditing] = useState(false);

  if (loading && !p) return <LoadingState />;
  if (error || !p) return <ErrorState message={error ?? "Project not found"} onRetry={reload} />;

  const docs = [
    ...p.quotations.map((q) => ({ id: q.id, href: `/quotations/${q.id}`, number: q.number, title: q.title, status: q.status, total: money(q.total, q.currency) })),
    ...p.invoices.map((i) => ({ id: i.id, href: `/invoices/${i.id}`, number: i.number, title: i.title, status: i.status, total: money(i.total, i.currency) })),
  ];

  return (
    <>
      <PageHeading
        eyebrow="Project"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.name} <StatusBadge status={p.status} />
          </span>
        }
        description={p.client ? <Link href={`/clients/${p.client.id}`}>{p.client.company || p.client.name}</Link> : undefined}
        back={{ href: "/projects", label: "All projects" }}
        actions={
          !editing && (
            <button type="button" className={buttonClass.primary} onClick={() => setEditing(true)}>
              Edit project
            </button>
          )
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card title="Documents">
          {docs.length === 0 ? (
            <p className="text-sm text-slate-500">No quotations or invoices linked to this project.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={d.href} className="min-w-0">
                    <span className="font-semibold text-slate-900">{d.number}</span> <span className="text-slate-500">· {d.title}</span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={d.status} />
                    <span className="w-24 text-right font-medium">{d.total}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={editing ? "Edit project" : "Details"}>
          {editing ? (
            <ProjectForm
              initial={p}
              onSaved={() => {
                setEditing(false);
                void reload();
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <DescriptionList
              items={[
                ["Budget", money(p.budget, agency.currency)],
                ["Status", <StatusBadge key="s" status={p.status} />],
                ["Start", date(p.startDate)],
                ["End", date(p.endDate)],
                ["Description", p.description],
              ]}
            />
          )}
        </Card>
      </div>
    </>
  );
}
