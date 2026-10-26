import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = "<!doctype html><html><body>Triton server fixture</body></html>";
let directory;
let child;
let baseUrl;

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), ".triton-server-"));
  await mkdir(path.join(directory, "dist/assets"), { recursive: true });
  await writeFile(path.join(directory, "dist/index.html"), html);
  await writeFile(
    path.join(directory, "dist/assets/app-test.js"),
    "window.triton = true;",
  );
  await writeFile(path.join(directory, ".env"), "PRIVATE_FIXTURE=not-public");
  await writeFile(
    path.join(directory, "dist/.env"),
    "PRIVATE_FIXTURE=not-public",
  );
  await cp(path.join(root, "server.js"), path.join(directory, "server.js"));
  await symlink(
    path.join(root, "node_modules"),
    path.join(directory, "node_modules"),
    "dir",
  );
  child = spawn(process.execPath, [path.join(directory, "server.js")], {
    env: { ...process.env, PORT: "0", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  baseUrl = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Server failed to start: ${output}`)),
      5000,
    );
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/Server is running on port (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited (${code}): ${output}`));
    });
  });
});

after(async () => {
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("the installed Express server starts and serves root and deep SPA routes", async () => {
  for (const route of ["/", "/field-services/visit-management"]) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), html);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});

test("static JavaScript is served with its correct content type", async () => {
  const response = await fetch(baseUrl + "/assets/app-test.js");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);
  assert.equal(await response.text(), "window.triton = true;");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
});

test("missing assets and source/configuration paths return 404 rather than SPA HTML", async () => {
  for (const route of [
    "/assets/missing.js",
    "/.env",
    "/%2eenv",
    "/server.js",
    "/package.json",
    "/package-lock.json",
    "/src/main.js",
    "/node_modules/express/package.json",
    "/release.zip",
    "/api/missing",
  ]) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 404, route);
    assert.notEqual(await response.text(), html, route);
  }
});

test("POST bodies including benign Brotli input are not decoded or routed to the SPA", async () => {
  const response = await fetch(baseUrl + "/", {
    method: "POST",
    headers: { "content-type": "application/json", "content-encoding": "br" },
    body: brotliCompressSync(Buffer.from('{"fixture":true}')),
  });
  assert.equal(response.status, 404);
});

test("HEAD supports SPA navigation without returning a response body", async () => {
  const response = await fetch(baseUrl + "/field-services/visit-management", {
    method: "HEAD",
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
});
