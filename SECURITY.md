# Security maintenance

Production runs on Azure App Service `Triton-FE`, resource group `TritonV3`, production slot. The supported runtime for this release is Node 22.23.4 or newer in the Node 22 line. Updating npm packages does not update Azure's Node binary; verify both separately.

`npm run audit:security` rejects new npm advisories at every severity. One exact exception remains: Quill 2.0.3, GHSA-v3m3-f69x-jf25 (low severity), has no published upstream patch as of 2026-10-26. Its HTML export is sanitized with DOMPurify immediately before rendering, including the mail viewer. Regression tests exercise malicious embed attributes and URLs. Production builds also remove browser console calls so inherited callers cannot log credential-bearing Axios errors; development diagnostics remain available. Revisit this exception when Quill publishes a fix; a downgrade to 2.0.2 is not a verified security patch.

SheetJS is pinned to its official version-specific 0.20.3 archive and lockfile integrity. The npm registry's older `xlsx` release is vulnerable. Preserve the official source and integrity when updating it.

`runtime/package-lock.json` independently locks the Express server dependency tree. Its deployment audit has no exceptions: any runtime advisory fails packaging. Release archives contain only `dist/`, `server.js`, runtime manifests and production server dependencies. Source, environment files, build tools and old `node_modules` must not be deployed. Azure clean deployment removes stale files; preserve a private rollback artifact before the initial cleanup.

Build configuration comes from GitHub Actions variables/secrets. `VITE_` values become public browser code: do not put server credentials in them. The Syncfusion browser license is supplied as `VITE_SYNCFUSION_LICENSE_KEY`, and the API origin as `VITE_API_BASE_URL`.

Run `npm test`, `npm run audit:security`, `npm run build`, `npm run package:deployment`, and `npm run smoke:deployment` before release. CI repeats these checks and verifies `/build-info.json` matches the deployed Git commit. A real Microsoft login and backend tenant/role policy require separate integration verification; frontend state and HTML tests do not prove backend authorization.

The inherited repository-wide `npm run lint` command has no checked-in Vue/modern-JavaScript configuration and fails at baseline. The remediation was compared against a temporary correct parser configuration to distinguish existing findings from introduced ones; full lint cleanup is separate from this security release.
