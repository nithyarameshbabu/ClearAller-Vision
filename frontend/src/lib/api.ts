import axios from "axios";

const isBrowser = typeof window !== "undefined";

// In the browser, prefer same-origin requests.
// Local development is forwarded by the Vite proxy and production is handled by Netlify redirects.
const configuredBaseUrl = isBrowser ? "" : (import.meta.env.VITE_API_URL ?? "http://localhost:4000");

export const api = axios.create({
  baseURL: configuredBaseUrl
});
