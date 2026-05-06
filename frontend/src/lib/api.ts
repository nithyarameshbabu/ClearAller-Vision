import axios from "axios";

const isBrowser = typeof window !== "undefined";
const productionApiUrl = "https://clearaller-vision-api.onrender.com";

const defaultBaseUrl = isBrowser
  ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : productionApiUrl
  : "http://localhost:4000";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultBaseUrl
});
