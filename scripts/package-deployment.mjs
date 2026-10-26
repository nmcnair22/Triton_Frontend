import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = path.join(root, "deployment-package");
await readFile(path.join(root, "dist/index.html"));

// Accept only build output; environment files and symlinks never belong here.
async function verifyBuild(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.isSymbolicLink() ||
      entry.name.startsWith(".") ||
      entry.name.endsWith(".map")
    ) {
      throw new Error(`Unexpected build artifact: ${entry.name}`);
    }
    if (entry.isDirectory())
      await verifyBuild(path.join(directory, entry.name));
  }
}
await verifyBuild(path.join(root, "dist"));
await rm(destination, { recursive: true, force: true });
await mkdir(destination);
await cp(path.join(root, "dist"), path.join(destination, "dist"), {
  recursive: true,
});
await cp(path.join(root, "server.js"), path.join(destination, "server.js"));
for (const name of ["package.json", "package-lock.json"]) {
  await cp(path.join(root, "runtime", name), path.join(destination, name));
}
const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
await writeFile(
  path.join(destination, "dist/build-info.json"),
  JSON.stringify({ commit, builtAt: new Date().toISOString() }) + "\n",
);

execFileSync(
  process.execPath,
  [
    process.env.npm_execpath,
    "ci",
    "--omit=dev",
    "--ignore-scripts",
    "--no-fund",
  ],
  {
    cwd: destination,
    stdio: "inherit",
  },
);
execFileSync(
  process.execPath,
  [process.env.npm_execpath, "audit", "--omit=dev", "--audit-level=low"],
  {
    cwd: destination,
    stdio: "inherit",
  },
);
console.log(
  "Runtime package ready: dist, server.js, locked Express dependencies.",
);
