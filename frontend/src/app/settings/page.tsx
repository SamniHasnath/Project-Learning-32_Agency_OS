"use client";

import { useState } from "react";
import { PageHeading } from "@/components/workspace/workspace-ui";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return <><PageHeading title="Settings" description="Manage your workspace profile and preferences." />
    <form className="max-w-3xl space-y-5" onSubmit={(e) => { e.preventDefault(); setSaved(true); }}>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Agency profile</h2><p className="mt-1 text-sm text-slate-500">This information appears on your documents.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{setting("Agency name", "Northstar Creative")}{setting("Business email", "hello@northstarcreative.com", "email")}{setting("Phone number", "+1 (415) 555-0184", "tel")}{setting("Website", "northstarcreative.com")}</div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Regional preferences</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Default currency</span><select className="form-input" defaultValue="USD"><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option><option value="CAD">CAD — Canadian Dollar</option></select></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Timezone</span><select className="form-input" defaultValue="America/Los_Angeles"><option value="America/Los_Angeles">Pacific Time (US & Canada)</option><option value="America/New_York">Eastern Time (US & Canada)</option><option value="Europe/London">London</option></select></label></div></section>
      <div className="flex items-center gap-3"><button className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Save changes</button>{saved && <p role="status" className="text-sm text-emerald-700">Settings saved locally.</p>}</div>
    </form>
  </>;
}

function setting(label: string, value: string, type = "text") {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span><input className="form-input" defaultValue={value} type={type} /></label>;
}
