"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SettingsApi, type AgencySettings } from "@/services/agency-api";

type SettingsContextType = {
  settings: AgencySettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<AgencySettings>) => Promise<AgencySettings>;
  refreshSettings: () => Promise<void>;
};

const defaultSettings: AgencySettings = {
  id: "default",
  name: "Northstar Creative",
  email: "hello@northstarcreative.com",
  phone: "+1 (415) 555-0184",
  website: "northstarcreative.com",
  currency: "USD",
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: false,
  updateSettings: async () => defaultSettings,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AgencySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await SettingsApi.get();
      if (data && data.name) {
        setSettings(data);
      }
    } catch (err) {
      console.warn("Using default settings fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (data: Partial<AgencySettings>) => {
    try {
      const updated = await SettingsApi.update(data);
      setSettings(updated);
      return updated;
    } catch (err) {
      console.warn("Failed to update remote settings, applying local update:", err);
      const merged = { ...settings, ...data };
      setSettings(merged);
      return merged;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
