"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Metric, QuoteLine, WorkspaceRecord } from "@/types/domain";
import type { WorkspaceKind } from "@/services/workspace";

const titles: Record<WorkspaceKind, string> = {
  clients: "Clients",
  projects: "Projects",
  quotations: "Quotations",
  invoices: "Invoices",
  payments: "Payments",
  templates: "Templates",
  documents: "Documents",
};
const singular: Record<WorkspaceKind, string> = {
  clients: "client", projects: "project", quotations: "quotation",
  invoices: "invoice", payments: "payment", templates: "template", documents: "document",
};
const createPath: Partial<Record<WorkspaceKind, string>> = {
  clients: "/clients/new", quotations: "/quotations/new", invoices: "/invoices/new",
};

export function PageHeading({ title, description, action }: {
  title: string; description: string; action?: { label: string; href: string };
}) {
  return <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
    <div><p className="text-sm font-medium text-brand-700">Workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1><p className="mt-1.5 text-sm text-slate-500">{description}</p></div>
    {action && <Link href={action.href} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">{action.label}</Link>}
  </div>;
}

export function StatusBadge({ status }: { status: string }) {
  const color = status === "Paid" || status === "Accepted" || status === "Active" || status === "Completed"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
    : status === "Overdue" || status === "Declined"
      ? "bg-rose-50 text-rose-700 ring-rose-600/15"
      : status === "Sent" || status === "In progress"
        ? "bg-blue-50 text-blue-700 ring-blue-700/10"
        : "bg-amber-50 text-amber-700 ring-amber-600/20";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color}`}>{status}</span>;
}

const money = (amount?: number) => amount === undefined ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

export function WorkspaceList({ kind, records }: { kind: WorkspaceKind; records: WorkspaceRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState("Newest first");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const matches = records.filter((r) =>
      (!query || [r.title, r.subtitle, r.id, r.secondary].some((v) => v?.toLowerCase().includes(query))) &&
      (status === "All statuses" || r.status === status),
    );
    return matches.sort((a, b) => sort === "Oldest first" ? a.date.localeCompare(b.date) :
      sort === "Amount: high to low" ? (b.amount ?? 0) - (a.amount ?? 0) :
      sort === "Amount: low to high" ? (a.amount ?? 0) - (b.amount ?? 0) : b.date.localeCompare(a.date));
  }, [records, search, status, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasAmount = records.some((r) => r.amount !== undefined);
  const hrefFor = (id: string) => `/${kind}/${encodeURIComponent(id)}`;
  return <>
    <PageHeading title={titles[kind]} description={`Manage and keep track of your ${titles[kind].toLowerCase()} in one place.`} action={createPath[kind] ? { label: `+ New ${singular[kind]}`, href: createPath[kind]! } : undefined} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
        <label className="relative flex-1"><span className="sr-only">Search {titles[kind].toLowerCase()}</span><input className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder={`Search ${titles[kind].toLowerCase()}...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} type="search" /></label>
        <label><span className="sr-only">Filter by status</span><select className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option>All statuses</option>{Array.from(new Set(records.map((r) => r.status))).map((s) => <option key={s}>{s}</option>)}</select></label>
        <label><span className="sr-only">Sort records</span><select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={sort} onChange={(e) => setSort(e.target.value)}><option>Newest first</option><option>Oldest first</option>{hasAmount && <><option>Amount: high to low</option><option>Amount: low to high</option></>}</select></label>
      </div>
      {filtered.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">⌕</div><h2 className="mt-4 text-sm font-semibold text-slate-900">No {titles[kind].toLowerCase()} found</h2><p className="mt-1 text-sm text-slate-500">{search || status !== "All statuses" ? "Try adjusting your search or filters." : `Get started by adding your first ${singular[kind]}.`}</p>{createPath[kind] && <Link href={createPath[kind]!} className="mt-4 inline-flex text-sm font-semibold text-brand-700">Create {singular[kind]} <span aria-hidden="true"> →</span></Link>}</div> :
      <>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-5 py-3">Name / reference</th><th className="px-5 py-3">Status</th>{hasAmount && <th className="px-5 py-3 text-right">Amount</th>}<th className="px-5 py-3">Date</th><th className="px-5 py-3">Details</th><th className="px-5 py-3"><span className="sr-only">Open</span></th></tr></thead>
        <tbody className="divide-y divide-slate-100">{visible.map((r) => <tr key={r.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><Link href={hrefFor(r.id)} className="font-semibold text-slate-900 hover:text-brand-700">{r.title}</Link><p className="mt-1 text-xs text-slate-500">{r.subtitle} <span className="text-slate-400">· {r.id}</span></p></td><td className="px-5 py-4"><StatusBadge status={r.status} /></td>{hasAmount && <td className="px-5 py-4 text-right font-medium text-slate-800">{money(r.amount)}</td>}<td className="whitespace-nowrap px-5 py-4 text-slate-600">{new Date(`${r.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td className="px-5 py-4 text-slate-500">{r.secondary ?? "—"}</td><td className="px-5 py-4"><Link aria-label={`View ${r.title}`} className="rounded-md px-2 py-1 text-brand-700 hover:bg-brand-50" href={hrefFor(r.id)}>View</Link></td></tr>)}</tbody></table></div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-500 sm:flex-row"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} results</span><div className="flex gap-2"><button className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </>}
    </section>
  </>;
}

export function Dashboard({ metrics, activity }: { metrics: Metric[]; activity: WorkspaceRecord[] }) {
  const chart = [32, 48, 42, 62, 55, 72, 61, 84, 72, 92, 76, 100];
  return <><PageHeading title="Good morning, Alex" description="Here’s what’s happening with your agency today." action={{ label: "+ Create quotation", href: "/quotations/new" }} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((m) => <article key={m.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{m.label}</p><span className={`size-2.5 rounded-full ${m.tone === "green" ? "bg-emerald-500" : m.tone === "amber" ? "bg-amber-500" : m.tone === "blue" ? "bg-blue-500" : "bg-brand-600"}`} /></div><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{m.value}</p><p className="mt-1 text-xs text-slate-500">{m.change}</p></article>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Revenue overview</h2><p className="mt-1 text-sm text-slate-500">Revenue collected over the last 12 months</p></div><span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">This year⌄</span></div><div className="mt-7 flex h-48 items-end gap-2 border-b border-l border-slate-100 px-2 sm:gap-4">{chart.map((h, i) => <div key={i} className="flex h-full flex-1 items-end"><div aria-label={`Month ${i + 1}: ${h}%`} className={`w-full rounded-t-sm ${i === 9 ? "bg-brand-600" : "bg-brand-100"}`} style={{ height: `${h}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Dec</span></div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Recent activity</h2><Link className="text-xs font-semibold" href="/payments">View all</Link></div><ul className="mt-3 divide-y divide-slate-100">{activity.map((item) => <li key={item.id} className="flex items-start gap-3 py-3"><span className={`mt-1.5 size-2 rounded-full ${item.status === "Overdue" ? "bg-rose-500" : "bg-brand-500"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle}</p></div><time className="whitespace-nowrap text-[11px] text-slate-400">{new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></li>)}</ul></section></div>
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold text-slate-900">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Jump back into the work that matters.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Add a client", "/clients/new", "Keep your contacts organized"], ["Create a quotation", "/quotations/new", "Send a polished estimate"], ["Create an invoice", "/invoices/new", "Get paid for your work"]].map(([label, href, text]) => <Link key={label} href={href} className="rounded-lg border border-slate-200 p-4 transition hover:border-brand-200 hover:bg-brand-50/40"><p className="text-sm font-semibold text-slate-900">{label} <span className="text-brand-600">↗</span></p><p className="mt-1 text-xs text-slate-500">{text}</p></Link>)}</div></section>
  </>;
}

export function WorkspaceForm({ kind }: { kind: "clients" | "quotations" | "invoices" }) {
  const router = useRouter();
  const [lines, setLines] = useState<QuoteLine[]>([{ id: "line-1", description: "", quantity: 1, rate: 0 }]);
  const [tax, setTax] = useState(10);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const heading = kind === "clients" ? "Add a client" : kind === "quotations" ? "Create a quotation" : "Create an invoice";
  const total = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const data = new FormData(e.currentTarget);
    if (!data.get("name") || !data.get("email")) { setError("Please complete the required fields."); return; }
    if (kind !== "clients" && lines.some((line) => !line.description.trim() || line.quantity < 1 || line.rate < 0)) { setError("Add a description, quantity, and valid rate for each line item."); return; }
    setSaved(true);
  }
  if (saved) return <section className="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-700">✓</span><h2 className="mt-4 text-lg font-semibold text-slate-900">{kind === "clients" ? "Client added" : `${kind === "quotations" ? "Quotation" : "Invoice"} saved as draft`}</h2><p className="mt-2 text-sm text-slate-500">Your changes are saved locally for this session.</p><button onClick={() => router.push(`/${kind}`)} className="mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Back to {titles[kind]}</button></section>;
  return <><PageHeading title={heading} description={kind === "clients" ? "Add a new client to your workspace." : "Add the details and line items for your document."} />
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_320px]"><div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">{kind === "clients" ? "Client details" : "Document details"}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{field("Client / company name", "name", true)}{field("Email address", "email", true, "email")}{kind === "clients" && <>{field("Contact person", "contact")}{field("Phone number", "phone", false, "tel")}{field("Industry", "industry")}</>}{kind !== "clients" && <>{field("Title / project", "project", true)}<label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Issue date</span><input className="form-input" name="issueDate" type="date" defaultValue="2026-09-27" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Due / expiry date</span><input className="form-input" name="dueDate" type="date" defaultValue="2026-10-27" /></label></>}</div>{kind === "clients" && <label className="mt-4 block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Notes</span><textarea className="form-input min-h-24" name="notes" placeholder="Add a note about this client..." /></label>}</section>
      {kind !== "clients" && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Line items</h2><p className="mt-1 text-sm text-slate-500">Describe the work and set your rate.</p></div></div><div className="mt-4 space-y-3">{lines.map((line, index) => <div key={line.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_90px_130px_auto] sm:items-end"><label><span className="mb-1 block text-xs font-medium text-slate-600">Description</span><input className="form-input" value={line.description} onChange={(e) => setLines(lines.map((x) => x.id === line.id ? { ...x, description: e.target.value } : x))} placeholder="e.g. Visual identity design" /></label><label><span className="mb-1 block text-xs font-medium text-slate-600">Qty</span><input className="form-input" type="number" min="1" value={line.quantity} onChange={(e) => setLines(lines.map((x) => x.id === line.id ? { ...x, quantity: Number(e.target.value) } : x))} /></label><label><span className="mb-1 block text-xs font-medium text-slate-600">Rate ($)</span><input className="form-input" type="number" min="0" step="0.01" value={line.rate} onChange={(e) => setLines(lines.map((x) => x.id === line.id ? { ...x, rate: Number(e.target.value) } : x))} /></label><div className="flex items-center justify-between gap-2 sm:pb-2"><span className="text-sm font-medium text-slate-700">{money(line.quantity * line.rate)}</span>{lines.length > 1 && <button type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setLines(lines.filter((x) => x.id !== line.id))} className="text-sm text-rose-600">Remove</button>}</div></div>)}</div><button type="button" className="mt-3 text-sm font-semibold text-brand-700 hover:text-brand-800" onClick={() => setLines([...lines, { id: `line-${Date.now()}`, description: "", quantity: 1, rate: 0 }])}>+ Add line item</button></section>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Additional information</h2><label className="mt-4 block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Notes and terms</span><textarea className="form-input min-h-24" name="notes" placeholder="Add any helpful context or payment terms..." /></label></section>
    </div>
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">{kind === "clients" ? "Ready to add?" : "Summary"}</h2>{kind !== "clients" && <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(total)}</span></div><label className="flex items-center justify-between gap-2 text-slate-600"><span>Tax (%)</span><input className="form-input w-20 text-right" type="number" min="0" max="100" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></label><div className="border-t border-slate-200 pt-3 font-semibold text-slate-900"><div className="flex justify-between"><span>Total</span><span>{money(total * (1 + tax / 100))}</span></div></div></div>}<p className="mt-3 text-xs leading-5 text-slate-500">{kind === "clients" ? "Client information is kept in this workspace." : "You can review and send this document later."}</p>{error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-5 flex flex-col gap-2"><button className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" type="submit">{kind === "clients" ? "Add client" : "Save as draft"}</button><Link href={`/${kind}`} className="rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</Link></div></aside></form></>;
}

function field(label: string, name: string, required = false, type = "text") {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span><input className="form-input" name={name} required={required} type={type} /></label>;
}

export function RecordDetail({ kind, record }: { kind: WorkspaceKind; record?: WorkspaceRecord }) {
  const [paid, setPaid] = useState(0);
  const [message, setMessage] = useState("");
  const router = useRouter();
  if (!record) return <><PageHeading title="Record not found" description="This record may have been removed or the link is incorrect." /><Link href={`/${kind}`} className="text-sm font-semibold">← Back to {titles[kind]}</Link></>;
  const due = Math.max((record.amount ?? 0) - paid, 0);
  const quotation = kind === "quotations";
  const invoice = kind === "invoices";
  const payment = kind === "payments";
  const preview = quotation ? <Link href={`/quotations/${encodeURIComponent(record.id)}/preview`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Preview</Link> : null;
  return <><PageHeading title={record.title} description={`${record.id} · ${record.subtitle}`} action={{ label: `← All ${titles[kind].toLowerCase()}`, href: `/${kind}` }} />
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]"><section className="space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">Status</p><div className="mt-2"><StatusBadge status={record.status} /></div></div>{preview}</div><div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Client / contact</p><p className="mt-1 text-sm font-medium text-slate-800">{record.subtitle}</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Date</p><p className="mt-1 text-sm font-medium text-slate-800">{new Date(`${record.date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>{record.secondary && <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Details</p><p className="mt-1 text-sm font-medium text-slate-800">{record.secondary}</p></div>}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">{payment ? "Payment details" : "Summary"}</h2><div className="mt-4 overflow-hidden rounded-lg border border-slate-200"><table className="w-full text-sm"><tbody><tr><td className="px-4 py-3 text-slate-600">{payment ? "Received" : "Total amount"}</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{money(record.amount)}</td></tr>{invoice && <><tr><td className="px-4 py-3 text-slate-600">Paid to date</td><td className="px-4 py-3 text-right text-slate-700">{money(paid)}</td></tr><tr><td className="px-4 py-3 font-semibold text-slate-900">Outstanding</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{money(due)}</td></tr></>}</tbody></table></div></div>
      {invoice && <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Record a payment</h2><p className="mt-1 text-sm text-slate-500">Outstanding balance: {money(due)}</p><form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const amount = Number(data.get("amount")); if (!Number.isFinite(amount) || amount <= 0 || amount > due) { setMessage(`Enter an amount greater than $0 and no more than ${money(due)}.`); return; } setPaid(paid + amount); setMessage("Payment recorded locally."); e.currentTarget.reset(); }}><label className="sr-only" htmlFor="payment-amount">Payment amount</label><input id="payment-amount" className="form-input" name="amount" type="number" min="0.01" step="0.01" max={due} placeholder="Amount received" disabled={due <= 0} /><button type="submit" disabled={due <= 0} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Record payment</button></form>{message && <p role="status" className={`mt-3 text-sm ${message.startsWith("Enter") ? "text-rose-700" : "text-emerald-700"}`}>{message}</p>}</div>}
      {message && payment && <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}</section>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Actions</h2><div className="mt-4 flex flex-col gap-2">{preview}{quotation && <button onClick={() => setMessage("Quotation marked as sent (local preview).")} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Mark as sent</button>}{invoice && <button onClick={() => setMessage("Invoice marked as sent (local preview).")} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Mark as sent</button>}<button onClick={() => router.push(`/${kind}`)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to list</button>{message && !invoice && <p role="status" className="text-xs text-emerald-700">{message}</p>}</div></aside></div></>;
}

export function QuotationPreview({ record }: { record?: WorkspaceRecord }) {
  if (!record) return <RecordDetail kind="quotations" />;
  return <><PageHeading title="Quotation preview" description={`Review how ${record.id} will appear to your client.`} action={{ label: "Back to quotation", href: `/quotations/${encodeURIComponent(record.id)}` }} /><article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6"><div><p className="text-lg font-bold text-brand-700">NORTHSTAR <span className="text-slate-500">CREATIVE</span></p><p className="mt-2 text-sm text-slate-500">Creative work, thoughtfully done.</p></div><div className="text-right"><h2 className="text-xl font-semibold text-slate-900">QUOTATION</h2><p className="mt-1 text-sm text-slate-500">{record.id}</p></div></div><div className="grid gap-5 py-6 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prepared for</p><p className="mt-2 font-medium text-slate-900">{record.subtitle}</p></div><div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date issued</p><p className="mt-2 font-medium text-slate-900">{record.date}</p></div></div><h3 className="text-lg font-semibold text-slate-900">{record.title}</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[400px] text-sm"><thead><tr><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody><tr><td className="px-4 py-4 text-slate-700">{record.title}</td><td className="px-4 py-4 text-right font-medium">{money(record.amount)}</td></tr></tbody></table></div><div className="ml-auto mt-5 max-w-xs space-y-3 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(record.amount)}</span></div><div className="flex justify-between text-slate-600"><span>Tax</span><span>$0</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900"><span>Total</span><span>{money(record.amount)}</span></div></div><p className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">This preview is for demonstration only. Contact your agency with any questions about this proposal.</p></article></>;
}
