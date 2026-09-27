export type ApiConnectionState =
  | { status: "loading" }
  | { status: "connected"; message: string }
  | { status: "error"; message: string };
