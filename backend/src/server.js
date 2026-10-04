/**
 * Lokaler Entwicklungsserver.
 * Fährt die echten Vercel-Funktionen aus frontend/api gegen eine lokale Postgres
 * (LOCAL_PG=1 → "pg"-Treiber statt Neon). So gibt es nur EINE API-Implementierung.
 *
 * Start:  DATABASE_URL=postgres://... ADMIN_TOKEN=geheim npm run dev
 * Vite:   VITE_API_URL=http://localhost:4000/api npm run dev:frontend
 */
import { createServer } from "node:http";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.LOCAL_PG ??= "1";
process.env.ADMIN_TOKEN ??= "change-me";
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL fehlt. Beispiel: postgres://user@localhost:5432/efsez");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDir = join(__dirname, "..", "..", "frontend", "api");
const PORT = Number(process.env.PORT || 4000);

// Alle Route-Dateien einsammeln (ohne _lib) und wie Vercel in Routen übersetzen.
const routes = [];
function collect(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "_lib") collect(full);
      continue;
    }
    if (!entry.endsWith(".js")) continue;
    let route = "/" + relative(apiDir, full).replace(/\\/g, "/").replace(/\.js$/, "");
    if (route.endsWith("/index")) route = route.slice(0, -6) || "/";
    const params = [];
    const pattern = new RegExp(
      "^" + route.replace(/\[([^\]]+)\]/g, (_, name) => { params.push(name); return "([^/]+)"; }) + "/?$"
    );
    routes.push({ pattern, params, file: full, specificity: params.length });
  }
}
collect(apiDir);
routes.sort((a, b) => a.specificity - b.specificity);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (!url.pathname.startsWith("/api")) {
    res.writeHead(404).end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  const path = url.pathname.replace(/^\/api/, "") || "/";
  const route = routes.find((candidate) => candidate.pattern.test(path));
  if (!route) {
    res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Nicht gefunden" }));
    return;
  }

  const match = path.match(route.pattern);
  const query = Object.fromEntries(url.searchParams.entries());
  route.params.forEach((name, index) => { query[name] = decodeURIComponent(match[index + 1]); });

  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = raw;
  try { body = raw ? JSON.parse(raw) : undefined; } catch { /* Rohtext belassen */ }

  const vercelReq = { method: req.method, headers: req.headers, query, body, url: req.url };
  const vercelRes = {
    status(code) { res.statusCode = code; return vercelRes; },
    setHeader(key, value) { res.setHeader(key, value); return vercelRes; },
    json(payload) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(payload)); },
    send(payload) { res.end(typeof payload === "string" ? payload : JSON.stringify(payload)); },
    end(payload) { res.end(payload); }
  };

  try {
    const { default: handler } = await import(pathToFileURL(route.file).href);
    await handler(vercelReq, vercelRes);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "Serverfehler" }));
  }
});

server.listen(PORT, () => {
  console.log(`EFSE'Z API lokal: http://localhost:${PORT}/api  (${routes.length} Routen, LOCAL_PG=${process.env.LOCAL_PG})`);
});
