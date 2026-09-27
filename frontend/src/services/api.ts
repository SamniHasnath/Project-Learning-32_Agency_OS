const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getApiText(
  path: string,
  signal?: AbortSignal,
): Promise<string> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, { signal });

  if (!response.ok) {
    throw new Error(`The API responded with HTTP ${response.status}.`);
  }

  return response.text();
}
