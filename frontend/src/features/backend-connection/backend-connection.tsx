"use client";

import { StatusMessage } from "@/components/status-message";
import { useBackendConnection } from "@/hooks/use-backend-connection";

export function BackendConnection() {
  const connection = useBackendConnection();

  if (connection.status === "loading") {
    return <StatusMessage tone="muted">Checking the backend API...</StatusMessage>;
  }

  if (connection.status === "error") {
    return (
      <StatusMessage tone="error">
        Could not connect to the backend: {connection.message}
      </StatusMessage>
    );
  }

  return (
    <StatusMessage tone="success">
      Connected. API response:{" "}
      <span className="font-mono">{connection.message}</span>
    </StatusMessage>
  );
}
