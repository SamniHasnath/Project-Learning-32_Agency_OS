"use client";

import { useEffect, useState } from "react";

type ConnectionState =
  | { status: "loading" }
  | { status: "connected"; message: string }
  | { status: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function BackendConnection() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const response = await fetch(`${API_URL}/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`The API responded with HTTP ${response.status}.`);
        }

        const message = await response.text();
        setConnection({ status: "connected", message });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setConnection({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while contacting the API.",
        });
      }
    }

    void checkBackend();

    return () => controller.abort();
  }, []);

  if (connection.status === "loading") {
    return (
      <p className="mt-3 text-sm text-slate-400" role="status">
        Checking http://localhost:3001...
      </p>
    );
  }

  if (connection.status === "error") {
    return (
      <p className="mt-3 text-sm text-rose-300" role="alert">
        Could not connect to the backend: {connection.message}
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm text-emerald-300" role="status">
      Connected. API response: <span className="font-mono">{connection.message}</span>
    </p>
  );
}
