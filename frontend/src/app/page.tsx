import { BackendConnection } from "./backend-connection";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <p className="text-lg font-semibold tracking-tight">Agency OS</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Development workspace
          </p>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-5 text-sm font-medium text-cyan-300">
            Your agency, in sync.
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Quotation to payment, all in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This Next.js page is checking its connection to the NestJS API.
            Later phases will add your clients, quotations, invoices, and
            payments.
          </p>

          <div className="mt-12 max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-medium text-slate-300">
              Backend connection
            </p>
            <BackendConnection />
          </div>
        </section>
      </div>
    </main>
  );
}
