"use client";

import { useEffect, useState } from "react";
import { PageHeading } from "@/components/workspace/workspace-ui";
import { useSettings } from "@/context/settings-context";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    name: "Northstar Creative",
    email: "hello@northstarcreative.com",
    phone: "+1 (415) 555-0184",
    website: "northstarcreative.com",
    currency: "USD",
    timezone: "America/Los_Angeles",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "Northstar Creative",
        email: settings.email || "hello@northstarcreative.com",
        phone: settings.phone || "+1 (415) 555-0184",
        website: settings.website || "northstarcreative.com",
        currency: settings.currency || "USD",
        timezone: "America/Los_Angeles",
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        currency: formData.currency,
      });
      setSaved(true);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeading title="Settings" description="Manage your workspace profile and preferences." />
      <form className="max-w-3xl space-y-5" onSubmit={handleSubmit}>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Agency profile</h2>
          <p className="mt-1 text-sm text-slate-500">This information appears on your documents.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Agency name</span>
              <input
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                type="text"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Business email</span>
              <input
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                type="email"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</span>
              <input
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                type="tel"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Website</span>
              <input
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                type="text"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Regional preferences</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Default currency</span>
              <select
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — Pound Sterling</option>
                <option value="CAD">CAD — Canadian Dollar</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Timezone</span>
              <select
                className="form-input w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
              >
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="Europe/London">London</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <p role="status" className="text-sm font-medium text-emerald-700">Settings saved successfully.</p>}
        </div>
      </form>
    </>
  );
}
