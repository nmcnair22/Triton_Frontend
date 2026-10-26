import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function auditFailures(report) {
  if (
    !report ||
    report.error ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== "object" ||
    Array.isArray(report.vulnerabilities)
  ) {
    throw new Error("Invalid npm audit report");
  }
  return Object.entries(report.vulnerabilities)
    .filter(([name, finding]) => {
      const mitigatedQuill =
        name === "quill" &&
        finding.name === "quill" &&
        finding.severity === "low" &&
        finding.range === "=2.0.3" &&
        Array.isArray(finding.via) &&
        finding.via.length === 1 &&
        finding.via[0].url ===
          "https://github.com/advisories/GHSA-v3m3-f69x-jf25" &&
        finding.via[0].severity === "low";
      return !mitigatedQuill;
    })
    .map(([name]) => name);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, "audit", "--json"],
    { encoding: "utf8" },
  );
  if (result.error || ![0, 1].includes(result.status))
    throw new Error("npm audit could not complete");
  const report = JSON.parse(result.stdout);
  const failures = auditFailures(report);
  if (failures.length)
    throw new Error(`Unremediated npm advisories: ${failures.join(", ")}`);
  console.log(
    "Security audit passed. Only GHSA-v3m3-f69x-jf25 (Quill HTML export, mitigated at render sinks) is permitted.",
  );
}
