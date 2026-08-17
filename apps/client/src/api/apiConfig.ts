const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");

export function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${normalizedPath}`;
}
