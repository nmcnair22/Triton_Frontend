import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

async function verify(baseUrl, expectedCommit) {
  const request = (route, options) =>
    fetch(new URL(route, baseUrl), {
      signal: AbortSignal.timeout(10000),
      ...options,
    });
  let html;
  for (const route of [
    "/",
    "/auth/login",
    "/field-services/visit-management",
  ]) {
    const response = await request(route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-powered-by"), null);
    const body = await response.text();
    assert.match(body, /<div id="app">/);
    if (route === "/") html = body;
    else assert.equal(body, html);
  }
  const asset = html.match(/src="([^"]+\.js)"/);
  assert.ok(asset, "HTML must reference the compiled JavaScript entry");
  const script = await request(asset[1]);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  for (const route of [
    "/.env",
    "/server.js",
    "/package.json",
    "/src/main.js",
    "/node_modules/express/package.json",
    "/release.zip",
    "/assets/missing.js",
    "/api/missing",
  ]) {
    assert.equal((await request(route)).status, 404, route);
  }
  assert.equal(
    (await request("/", { method: "POST", body: "benign smoke check" })).status,
    404,
  );
  const metadata = await request("/build-info.json");
  assert.equal(metadata.status, 200);
  const build = await metadata.json();
  if (expectedCommit)
    assert.equal(build.commit, expectedCommit, "Running frontend commit");
  console.log(
    JSON.stringify({
      result: "PASS",
      baseUrl,
      commit: build.commit,
      checked:
        "SPA routes, JavaScript, headers, blocked files, POST rejection, release identity",
    }),
  );
}

const [baseUrl, expectedCommit] = process.argv.slice(2);
if (baseUrl) {
  await verify(baseUrl, expectedCommit);
} else {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: fileURLToPath(new URL("../deployment-package/", import.meta.url)),
    env: { ...process.env, PORT: "0", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const localUrl = await new Promise((resolve, reject) => {
      let output = "";
      const timer = setTimeout(
        () => reject(new Error(`Runtime package failed to start: ${output}`)),
        10000,
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
        reject(new Error(`Runtime package exited (${code}): ${output}`));
      });
    });
    await verify(localUrl);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
  }
}
