"use client";

import { useEffect, useState } from "react";
import { getApiText } from "@/services/api";
import type { ApiConnectionState } from "@/types/api";

export function useBackendConnection(): ApiConnectionState {
  const [connection, setConnection] = useState<ApiConnectionState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function checkBackend() {
      try {
        const message = await getApiText("/", controller.signal);
        setConnection({ status: "connected", message });
      } catch (error) {
        if (controller.signal.aborted) {
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

  return connection;
}
