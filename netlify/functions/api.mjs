import { buildApp } from "../../backend/dist/app.js";

let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }

  return appPromise;
}

function toRoutePath(rawPath) {
  const normalized = rawPath.replace(/^\/\.netlify\/functions\/api/, "");
  return normalized || "/";
}

export async function handler(event) {
  const app = await getApp();
  const routePath = toRoutePath(event.path || "/");
  const query = event.rawQuery ? `?${event.rawQuery}` : "";
  const payload = event.body
    ? (event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body)
    : undefined;

  const response = await app.inject({
    method: event.httpMethod,
    url: `${routePath}${query}`,
    headers: event.headers,
    payload
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body
  };
}
