# Estimates / Quotes Module — Developer Guide

Last updated: 2025-09-11

This document onboards a new developer to the Estimates/Quotes feature in this Vue 3 + Vite + PrimeVue app. It covers the module’s architecture, routing, state models and actions, UI composition, calculations, CSV import, approvals/versioning, and troubleshooting so you can quickly add features or debug issues.


## Overview

- Purpose: Create, cost, review, and send multi‑site project estimates with Fixed, T&M, and Hybrid pricing. Includes site surveys, vendor bids, document intake, CSV import, approvals guardrail, basic versioning, and acceptance marking.
- Status: Fully front‑end with in‑memory Pinia store and seeded data. No backend persistence yet (by design for demo).


## Tech Stack & Conventions

- Framework: Vue 3.5 (script setup) with Vite 7.
- UI: PrimeVue 4.3, TailwindCSS, PrimeUIX themes.
- State: Pinia 3.
- Auto‑import: `unplugin-vue-components` with `@primevue/auto-import-resolver` for PrimeVue components and directives.
- Tooling: ESLint + Prettier config present.

Key setup points:
- Tooltip directive is globally registered in `src/main.js`: `app.directive('tooltip', Tooltip)` allowing `v-tooltip` usage in templates.
- PrimeVue, ConfirmationService, and ToastService registered in `src/main.js`.
- Components auto‑import configured in `vite.config.mjs` via `Components({ resolvers: [PrimeVueResolver()] })`. This allows using `<DataTable />`, `<Dialog />`, etc. without explicit imports in most SFCs.


## Routing

- Route: `/field-services/estimates`
- Definition: `src/router/index.js` → name `field-services-estimates`
- View: `src/views/field-services/EstimatesView.vue`
- Behavior: List + filters by default; launches an overlay builder (`<EstimateBuilder />`) for multi‑step creation/editing.


## Files & Structure

- View
  - `src/views/field-services/EstimatesView.vue` — list page, metrics, filters, actions, builder overlay.

- Builder & Steps
  - `src/components/estimates/EstimateBuilder.vue`
  - `src/components/estimates/StepProjectInfo.vue`
  - `src/components/estimates/StepScope.vue`
  - `src/components/estimates/StepCosting.vue`
  - `src/components/estimates/StepDocuments.vue`
  - `src/components/estimates/StepReviewSubmit.vue`
  - Dialogs: `LineItemModal.vue`, `SurveyRequestModal.vue`, `ImportCsvDialog.vue`

- State & Utilities
  - Store: `src/stores/estimatesStore.js`
  - Money helpers: `src/utils/money.js`
  - ID helpers: `src/utils/ids.js`

- Shared UI
  - `src/components/shared/MoneyCell.vue`
  - `src/components/shared/PercentCell.vue`
  - `src/components/shared/StatusTag.vue`
  - `src/components/shared/TotalsBar.vue`


## Data Models

All models live client‑side in the Pinia store. Key shapes as used by the UI (JS doc style for readability):

```ts
// Estimate
type Estimate = {
  id: string;                         // e.g., EST-20250911-ABC12
  clientName: string;
  projectName: string;
  contactPerson?: string;
  contactEmail?: string;
  pricingMode: 'Fixed' | 'T&M' | 'Hybrid';
  rateCardId?: string | null;         // required when T&M or Hybrid
  targetMarginPct?: number;           // used for guardrail
  status: 'Draft' | 'Submitted' | 'Awaiting Approval' | 'Approved' | 'Client Sent' | 'Accepted' | 'Rejected' | 'Converted';
  siteCount: number;                  // if sites[] provided, UI keeps this in sync with sites.length
  sites?: Site[];                     // optional explicit sites list
  lineItems: LineItem[];
  surveys?: Survey[];
  bids?: Bid[];
  documents?: Doc[];
  versions?: VersionSnapshot[];
  approvalStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  approvalReason?: string;
  acceptedAt?: string | null;         // ISO
  owner?: string;                     // display only
  updatedAt: string;                  // ISO, drives list filtering
  totals?: {
    perSite: { cost: number; charge: number; marginAmt: number; marginPct: number };
    grand:  { cost: number; charge: number; marginAmt: number; marginPct: number };
  };
  requiresApproval?: boolean;         // computed guardrail flag
};

type Site = {
  id: number | string;
  name: string; address: string;
  contactName?: string; contactPhone?: string;
};

type LineItem = {
  id: number | string;
  pricingType: 'Fixed' | 'T&M';
  category: 'Labor' | 'Materials' | 'Travel' | 'Other Fees' | string;
  description: string;
  vendor?: string;
  unit?: 'ea' | 'hrs' | 'ft' | 'day' | 'lot' | string;
  quantity: number;
  unitCost?: number;                  // required for Fixed
  margin?: number;                    // % for Fixed; UI back‑calc supports editing clientCharge
  role?: string | null;               // key from rate card (T&M)
  clientRate?: number | null;         // optional override (T&M)
};

type Survey = {
  id: string; vendor: string; location: string;
  status: 'Requested' | 'Scheduled' | 'Completed';
  scheduledDate?: string | null; estimatedCost?: number | null; actualCost?: number | null;
  notes?: string;
};

type Bid = {
  id: string; vendor_name: string; bid_name: string; bid_amount: number;
  received_date?: string; status?: 'Received' | 'Selected' | string; notes?: string;
};

type Doc = {
  id: string; name: string; type: 'client' | 'vendor' | 'cis'; source?: string;
  size?: number; uploadedAt: string; version: number;
};

type VersionSnapshot = {
  tag: string;                      // V1, V2, ...
  createdAt: string;                // ISO
  header: Pick<Estimate,'clientName'|'projectName'|'siteCount'|'pricingMode'|'targetMarginPct'>;
  lineItems: LineItem[]; totals: Estimate['totals'];
  status: 'Sent' | 'Accepted' | string;
};

// Rate Cards (store-scoped)
type RateCard = {
  id: string; name: string;
  roles: { key: string; label: string; clientRate: number }[];
};
```


## State Store (Pinia)

File: `src/stores/estimatesStore.js`

- State
  - `estimates: Estimate[]` — seeded on first load by `seedIfEmpty()`.
  - `vendors: string[]` — sample vendors for dropdowns.
  - `rateCards: RateCard[]` — two sample cards with roles; used by T&M.
  - `costCodes: { code, label }[]` — reserved; not strictly required by UI.
  - `currentId: string | null` — the active estimate used by the builder.

- Getters
  - `list` — array reference of all estimates.
  - `current` — active estimate object or null.
  - `metrics` — `{ open, surveysScheduled, awaitingApproval }` used by the list tiles.
  - `findById(id)` — find estimate by id.
  - `query({ statuses, search })` — filter by selected statuses and text search (client/project/id). The view applies date range filtering separately.

- Core actions
  - Session: `setCurrent(id)`, `clearCurrent()`
  - Estimates: `createEstimate(payload)`, `updateEstimate(id, patch)`, `duplicateEstimate(id)`, `deleteEstimate(id)`
  - Sites: `addSite(estimateId, site)`, `updateSite(estimateId, siteId, patch)`, `deleteSite(estimateId, siteId)`
  - Line Items: `addLineItem(estimateId, item)`, `updateLineItem(estimateId, itemId, patch)`, `deleteLineItem(estimateId, itemId)`
  - Surveys: `addSurvey(estimateId, survey)`
  - Bids: `addBid(estimateId, bid)`, `updateBid(estimateId, bidId, patch)`, `deleteBid(estimateId, bidId)`, `selectBidForLineItem(estimateId, bidId)` (creates a Fixed line item from a bid and marks bid selected)
  - Documents: `addDocument(estimateId, doc)`, `deleteDocument(estimateId, docId)`
  - Approvals: `requestApproval(id, reason)`, `setApprovalStatus(id, status)`
  - Versioning/Send/Accept: `snapshotVersion(id)`, `sendToClient(id)`, `markAccepted(id, versionTag)`
  - Status helper: `setStatus(id, status)`
  - Totals: `recalcTotals(estimate)` — recomputes per‑site and grand totals and guardrail flag

- Seeds
  - Initial five demo estimates across various statuses and pricing modes. `recalcTotals` runs on each seed before load.

- Totals & Guardrail
  - Per‑site totals derive from line items: cost, client charge, margin amount and percent.
  - Grand totals multiply per‑site by `siteCount` (or `sites.length` when sites are listed) and recompute margin.
  - Guardrail: `requiresApproval = targetMarginPct > 0 && perSite.marginPct < targetMarginPct`.


## Utility Functions

File: `src/utils/money.js`

- `round2(n)` — consistent rounding to 2 decimals.
- `formatCurrency(amount, {currency, locale})` — Intl‑based formatting.
- `formatPercent(pct)` — returns e.g. `42.00%`.
- Pricing math:
  - `clientChargeFromMargin(totalCost, marginPct)` — Fixed pricing canonical formula: charge = cost / (1 − m).
  - `marginFromClientCharge(totalCost, clientCharge)` — derive margin% from charge.
  - `tmClientCharge(qty, clientRate)` — T&M extended charge.
  - `tmMarginPct(unitCost, clientRate)` — T&M margin percent for display.
- Aggregation:
  - `sumLineItems(items)` — computes per‑site `cost`, `charge`, `marginAmt`, `marginPct` from mixed Fixed/T&M rows.

File: `src/utils/ids.js`

- `generateId(prefix)` — timestamp + random suffix.
- `newEstimateId()` — `EST-...` helper.
- `newSurveyId(seq?)` — friendly short id `SS-###` when a sequence is given.
- `nextVersionTag(existing)` — generates `V1`, `V2`, ...


## View: Estimates List

File: `src/views/field-services/EstimatesView.vue`

- Metrics: Three tiles bound to store metrics: Open Estimates, Site Surveys Scheduled, Awaiting Approval.
- Filters:
  - Status chips toggle filter; clear button.
  - Search input over client/project/id.
  - Date range (From/To) against `updatedAt`.
- Table columns:
  - ID, Client, Project, Pricing, Status (via `<StatusTag />`), Owner, Client Total (via `<MoneyCell />`), Updated, Actions.
- Actions per row: Open Builder, Duplicate, Download (mock), History (mock), Delete (with ConfirmDialog).
- Header actions:
  - New Estimate: creates draft, sets current, opens builder on Step 1.
  - Schedule Site Survey: ensures current estimate exists and opens builder on Step 3 with `surveys` tab selected.
- Builder overlay: Toggles `showEstimateBuilder` and renders `<EstimateBuilder :initial-step :initial-tab />`.


## Builder: Steps & Behavior

File: `src/components/estimates/EstimateBuilder.vue`

- Steps: 1) Project Info, 2) Scope, 3) Costing & Docs, 4) Review.
- Progress bar: index‑based percentage with a fixed start at 0% on step 1 and 100% on last step.
- Props: `initialStep`, `initialTab` (passed to StepCosting to select sub‑tab).
- Emits: `close` to return to list.

### Step 1 — Project Info (`StepProjectInfo.vue`)

- Required fields: Client Name, Project Name, Contact Email (email format).
- Pricing mode: Fixed, T&M, or Hybrid.
  - For `T&M`/`Hybrid`, a `rateCardId` is required; available cards come from the store.
- Sites:
  - Mode toggle: `count` vs `list`.
  - When in `list`, user can Add/Edit/Delete site rows via dialog; `siteCount` syncs to `sites.length` automatically by store actions.
  - Quick action: “Request Survey” opens `SurveyRequestModal` to create a scheduled survey.
- Navigation: “Next” validates then advances.

### Step 2 — Scope (`StepScope.vue`)

- Mode: Template vs Custom.
- Templates: Example selections prefill `tasks`, `laborRequirements`, and `materialsEquipment` fields. Custom mode lets the user type freeform.
- Navigation: Previous/Next.

### Step 3 — Costing & Docs (`StepCosting.vue`)

Tabs:
- Line Items & Costing
  - Data table of line items with Add/Edit/Delete.
  - Guardrail banner shows when per‑site margin% < `targetMarginPct`.
  - “Import CSV” opens `ImportCsvDialog` in Line Items mode.
  - Totals: `<TotalsBar />` displays per‑site and grand figures and flags below‑target margin visually.

- Site Surveys & Bids
  - Surveys grid (read‑only list); “Request Survey” opens `SurveyRequestModal`.
  - Bids grid with “New Bid (mock)” adds a sample bid; “Select for Line Item” creates a Fixed Materials line item at the bid amount.

- Documents & Processing
  - Renders `StepDocuments.vue` (see below).

Line Item Modal (`LineItemModal.vue`):
- Modes:
  - Fixed: requires `unitCost` & `margin`. Shows calculated client charge and allows back‑calculation by editing a temporary `clientCharge` field.
  - T&M: requires `role`; supports rate override via `clientRate` (otherwise inferred from selected rate card when possible).
- Validation on save; emits `save` to store action.

CSV Import (`ImportCsvDialog.vue`):
- Modes: `lineItems` and `bids`.
- Parsing: Uses `xlsx` to parse CSV; header row auto‑mapping heuristic; manual mapping UI per column.
- Preview: First 20 rows.
- Import:
  - Line Items: computes Fixed vs T&M, supports back‑calc of margin from `client_charge` when provided.
  - Bids: creates bid rows; you can later convert a bid into a line item.

Documents (`StepDocuments.vue`):
- Buckets: Client, Vendor, CIS.
- Upload: PrimeVue FileUpload with `customUpload`; store retains files as document metadata only (no binary persistence).
- Extract demo: Adds two example line items to illustrate document‑driven extraction.

### Step 4 — Review & Submit (`StepReviewSubmit.vue`)

- Summary tiles: per‑site client charge, per‑site margin%, grand total × siteCount.
- Approvals guardrail:
  - If `requiresApproval` and not `approved`, “Send to Client” is disabled.
  - Actions: Request Approval (stores reason and sets `approvalStatus` to `requested`), Approve/Reject (mocked inline controls).
- Send to Client: Creates version snapshot via `snapshotVersion()` and updates status to `Client Sent`.
- Mark as Accepted: Dialog to choose version tag and mark estimate accepted.
- Close returns to list.


## Shared UI

- `MoneyCell.vue` — Intl currency with semantic coloring (negative/red, zero/neutral, positive/green).
- `PercentCell.vue` — percent formatting with optional warn‑below styling for guardrail.
- `StatusTag.vue` — PrimeVue Tag with severity map by status.
- `TotalsBar.vue` — four cards: Per‑site Cost/Charge/Margin (+%), and Grand Total × siteCount.


## Calculations & Business Rules

- Fixed pricing client charge: `charge = cost / (1 − marginPct)`; rounded with `round2`.
- T&M client charge: `qty × clientRate`.
- Mixed totals per site: sum of per‑item costs and client charges.
- Grand totals: multiply per‑site by `siteCount` (or `sites.length` when present) and recompute margin.
- Margin percent: `marginPct = marginAmt / charge × 100` (safe for zero).
- Guardrail: `requiresApproval` when `perSite.marginPct < targetMarginPct`.


## Developer Recipes

- Open the builder on an existing estimate:
```js
const est = estimatesStore.findById('EST-...');
estimatesStore.setCurrent(est.id);
// In the view, set builderInitialStep/tab and show overlay
```

- Add a new T&M line item programmatically:
```js
store.addLineItem(est.id, {
  id: Date.now(), pricingType: 'T&M', category: 'Labor',
  description: 'Field tech (onsite)', unit: 'hrs', quantity: 8,
  role: 'tech', clientRate: 145
});
```

- Convert a bid to a line item:
```js
store.selectBidForLineItem(est.id, bid.id);
```

- Trigger versioning + send:
```js
const snap = store.sendToClient(est.id); // also updates status
```


## Running & Building

- Dev: `npm run dev` (Vite dev server)
- Build: `npm run build`
- Preview: `npm run preview`

Environment:
- PrimeVue auto‑import is configured in `vite.config.mjs` (do not remove).
- Tooltip directive is globally registered in `src/main.js` (used as `v-tooltip`).
- ConfirmationService and ToastService are in use; make sure to keep them registered in `src/main.js`.


## Troubleshooting

- “Unknown component: DataTable/Dialog/etc.”
  - Ensure `vite.config.mjs` includes `Components({ resolvers: [PrimeVueResolver()] })`.
  - If you prefer explicit imports, add `import DataTable from 'primevue/datatable'` in the SFC.

- “v-tooltip is not a directive”
  - Check `src/main.js` has `app.directive('tooltip', Tooltip)` and that Tooltip is imported from `primevue/tooltip`.

- Table renders but totals don’t update
  - Ensure all mutations to line items call store actions (`addLineItem`, `updateLineItem`, etc.) so `recalcTotals` runs.

- Site count doesn’t reflect sites list
  - Use store site actions (`addSite`, `updateSite`, `deleteSite`); they keep `siteCount` in sync.

- Approvals UI blocks sending even after approval
  - Verify `approvalStatus` is `approved` and `requiresApproval` is still true. If still blocked, re‑check `targetMarginPct` vs current per‑site margin.


## Extensibility Notes

- Persistence: Replace the in‑memory store with an API service layer. Mirror store actions to API calls and keep the local state as the cache.
- RBAC approvals: Replace inline approve/reject buttons with role‑gated flows tied to user permissions.
- CSV importer: Persist last column mappings in `localStorage`; add row‑level validation/errors and downloadable CSV templates.
- PDF/Quote generation: Implement a real preview and export pipeline; currently a mock button.
- History & Versions: Build a timeline view over `versions[]` and key mutation events for traceability.


## Quick Reference: Store API

- Estimates: `createEstimate`, `updateEstimate`, `duplicateEstimate`, `deleteEstimate`
- Session: `setCurrent`, `clearCurrent`
- Sites: `addSite`, `updateSite`, `deleteSite`
- Line Items: `addLineItem`, `updateLineItem`, `deleteLineItem`
- Surveys: `addSurvey`
- Bids: `addBid`, `updateBid`, `deleteBid`, `selectBidForLineItem`
- Documents: `addDocument`, `deleteDocument`
- Approvals: `requestApproval`, `setApprovalStatus`
- Versioning/Send/Accept: `snapshotVersion`, `sendToClient`, `markAccepted`
- Helpers: `findById`, `query`, `metrics`, `recalcTotals`


## Changelog (Module)

- Foundations: Tooltip registration; money/percent utils; ID helpers; in‑memory Pinia store with seeds; shared UI; fixed progress calc.
- List: Metrics binding; filters; actions; open builder.
- Builder: Componentized steps; wired to `store.current`; autosave‑style state handoff via direct store binding.
- Project Info: Required fields; pricing & rate card; sites list mode; “Request Survey”.
- Costing & Docs: Line items with Fixed + T&M; totals & guardrail; CSV import; surveys & bids tab; documents & extraction demo.
- Review & Submit: Summary tiles; approvals mock; send to client (versioning); mark accepted.


## Contact Points

- Primary modules: Estimates view and components under `src/components/estimates`.
- State logic: `src/stores/estimatesStore.js` is the single source of truth for calculations and side effects.

If you add or modify behavior, prefer changing the store first (calculation, status, and model integrity) and keep components thin, calling store actions.

