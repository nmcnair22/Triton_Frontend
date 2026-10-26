import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { transformWithEsbuild } from "vite";
import configure from "../vite.config.mjs";

async function compiledLogs(mode) {
  const config = configure({ mode });
  const { code } = await transformWithEsbuild(
    `
        const error = { config: { headers: { Authorization: 'Bearer synthetic-secret' } } };
        console.error('Invoice request failed', error);
        console.log(error.config);
        globalThis.applicationStillRuns = true;
    `,
    "diagnostics.js",
    config.esbuild,
  );
  const logs = [];
  const context = {
    console: {
      error: (...args) => logs.push(args),
      log: (...args) => logs.push(args),
    },
  };
  vm.runInNewContext(code, context);
  assert.equal(context.applicationStillRuns, true);
  return logs;
}

test("production builds remove credential-bearing console output from all browser callsites", async () => {
  assert.deepEqual(await compiledLogs("production"), []);
});

test("development builds retain console diagnostics", async () => {
  assert.equal((await compiledLogs("development")).length, 2);
});
