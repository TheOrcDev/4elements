import { createReadStream, existsSync } from "node:fs";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const outDir = join(
  appRoot,
  "../playground/public/models/gemini-4-carbon-high"
);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(join(appRoot, "index.html"), join(outDir, "index.html"));
await cp(join(appRoot, "assets"), join(outDir, "assets"), { recursive: true });

const serve = process.argv.includes("--serve");

if (!serve) {
  process.exit(0);
}

const portFlag = process.argv.indexOf("--port");
const port =
  portFlag === -1 ? 5190 : Number(process.argv[portFlag + 1] ?? 5190);
const root = resolve(appRoot);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const requested = normalize(decodeURIComponent(url.pathname));
  const relative = requested === "/" ? "index.html" : requested.slice(1);
  const filePath = resolve(root, relative);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/`);
});
