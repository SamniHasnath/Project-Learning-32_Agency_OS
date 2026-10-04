"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/primitives";
import { titleCase } from "@/lib/format";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  /** Enables sorting on this column. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
};

/**
 * Generic list table with search, status filter, column sorting and
 * pagination. Each row links to its detail page.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchText,
  statusOf,
  statuses,
  rowHref,
  searchPlaceholder = "Search…",
  empty,
  pageSize = 10,
}: {
  rows: T[];
  columns: Column<T>[];
  searchText: (row: T) => string;
  statusOf?: (row: T) => string;
  statuses?: string[];
  rowHref: (row: T) => string;
  searchPlaceholder?: string;
  empty: { title: string; description?: string; action?: ReactNode };
  pageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState<{ index: number; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows.filter((r) => (!q || searchText(r).toLowerCase().includes(q)) && (status === "ALL" || statusOf?.(r) === status));
    if (sort) {
      const value = columns[sort.index].sortValue!;
      result = [...result].sort((a, b) => {
        const av = value(a);
        const bv = value(b);
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
    }
    return result;
  }, [rows, search, status, sort, columns, searchText, statusOf]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const s = statusOf?.(r);
      if (s) map.set(s, (map.get(s) ?? 0) + 1);
    }
    return map;
  }, [rows, statusOf]);

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <EmptyState {...empty} />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Search</span>
          <input
            className="form-input"
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {statuses && (
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              className="form-input min-w-44"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses ({rows.length})</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)} ({counts.get(s) ?? 0})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching records" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {columns.map((col, i) => (
                    <th key={col.header} className={`px-5 py-3 ${col.align === "right" ? "text-right" : ""}`} aria-sort={sort?.index === i ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                      {col.sortValue ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-slate-900"
                          onClick={() => setSort((s) => (s?.index === i ? { index: i, dir: s.dir === 1 ? -1 : 1 } : { index: i, dir: 1 }))}
                        >
                          {col.header}
                          <span aria-hidden="true">{sort?.index === i ? (sort.dir === 1 ? "↑" : "↓") : "↕"}</span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    {columns.map((col, i) => (
                      <td key={col.header} className={`px-5 py-3.5 ${col.align === "right" ? "text-right" : ""}`}>
                        {i === 0 ? (
                          <Link href={rowHref(row)} className="block text-slate-900 hover:text-brand-700">
                            {col.cell(row)}
                          </Link>
                        ) : (
                          col.cell(row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-500 sm:flex-row">
            <span>
              Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={current === 1} onClick={() => setPage(current - 1)}>
                Previous
              </button>
              <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={current === pages} onClick={() => setPage(current + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
