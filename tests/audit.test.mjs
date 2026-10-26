import assert from "node:assert/strict";
import { test } from "node:test";
import { auditFailures } from "../scripts/check-audit.mjs";

const knownQuill = {
  name: "quill",
  severity: "low",
  range: "=2.0.3",
  via: [
    {
      url: "https://github.com/advisories/GHSA-v3m3-f69x-jf25",
      severity: "low",
    },
  ],
};

test("only the explicitly mitigated Quill advisory is permitted", () => {
  assert.deepEqual(
    auditFailures({ vulnerabilities: { quill: knownQuill } }),
    [],
  );
  assert.deepEqual(auditFailures({ vulnerabilities: {} }), []);
});

test("new advisories and escalated severity fail the security gate", () => {
  assert.deepEqual(
    auditFailures({
      vulnerabilities: { quill: { ...knownQuill, severity: "high" } },
    }),
    ["quill"],
  );
  assert.deepEqual(
    auditFailures({
      vulnerabilities: {
        quill: {
          ...knownQuill,
          via: [
            ...knownQuill.via,
            { url: "https://github.com/advisories/new", severity: "low" },
          ],
        },
      },
    }),
    ["quill"],
  );
  assert.deepEqual(
    auditFailures({
      vulnerabilities: {
        express: { name: "express", severity: "low", via: ["other"] },
      },
    }),
    ["express"],
  );
});

test("malformed or unavailable audit data fails closed", () => {
  assert.throws(
    () => auditFailures({ error: "registry unavailable" }),
    /Invalid npm audit report/,
  );
  assert.throws(() => auditFailures(null), /Invalid npm audit report/);
});
