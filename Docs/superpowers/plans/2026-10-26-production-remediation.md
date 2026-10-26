# Production security remediation

Goal: review and patch confirmed security/deployment defects in Triton_Frontend, publish the changes to main, deploy Triton-FE production, and verify the running release.

Approach: keep the existing Vue SPA, Express server, Azure App Service, and supported Node 22 runtime. Upgrade dependencies within compatible major versions; use the official patched SheetJS distribution. Package only dist, the server, and independently locked production server dependencies. Clean stale deployment files during release. Preserve the public API origin and existing login contract.

Alternatives: retaining the full source deployment leaves unnecessary configuration and dependency drift; a major Node upgrade adds unrelated migration risk. Neither is needed for this remediation.

- [ ] Establish baseline build/audit and private production rollback backup.
- [ ] Reproduce Express 5 startup failure; test SPA/static/blocked-source/POST behavior, then repair server behavior.
- [ ] Update dependency locks and mitigate rich HTML rendering, credential logging, and OAuth state handling with focused regression tests.
- [ ] Build a runtime-only package, audit its dependencies, test its actual server, and check no source/environment/build tools are included.
- [ ] Add CI security/tests/package checks and verify deployment through commit identity, HTTP checks, and Azure runtime evidence.
- [ ] Obtain independent review; address material findings, publish, deploy, and preserve production verification receipt.

Validation limits: frontend tests cannot prove backend authorization or complete a real Microsoft login without an interactive identity session. An upstream Quill advisory has no published patch; sanitize its exported HTML at every render sink and report that package exception explicitly.
