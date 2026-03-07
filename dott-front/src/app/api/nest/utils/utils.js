// Server-side: prefer APP_API_SERVER_URL (internal URL, e.g. http://dott-back:3000 in Docker).
// Client/build: NEXT_PUBLIC_APP_API_SERVER_URL. Fallback for local dev.
export const apiUrl =
  process.env.APP_API_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_API_SERVER_URL ||
  "http://localhost:3000";
export const apiPythonUrl = process.env.NEXT_PUBLIC_PYTHON_API_SERVER_URL || "http://localhost:8000";
