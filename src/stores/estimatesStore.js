import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { newEstimateId, newSurveyId, nextVersionTag } from '@/utils/ids';
import { clientChargeFromMargin, sumLineItems, round2 } from '@/utils/money';

export const useEstimatesStore = defineStore('estimates', () => {
  // --- State ---
  const estimates = ref([]);
  const vendors = ref([
    'ABC Supplies Co.',
    'Tech Solutions Inc.',
    'Global Materials',
    'Premium Hardware',
    'Local Contractor Services',
    'Network Pro Partners',
    'Datacenter Depot'
  ]);
  const rateCards = ref([
    {
      id: 'RC-STD',
      name: 'Standard Rate Card',
      roles: [
        { key: 'tech', label: 'Technician', clientRate: 125 },
        { key: 'engineer', label: 'Engineer', clientRate: 165 },
        { key: 'pm', label: 'Project Manager', clientRate: 145 }
      ]
    },
    {
      id: 'RC-PREM',
      name: 'Premium Rate Card',
      roles: [
        { key: 'tech', label: 'Technician', clientRate: 145 },
        { key: 'engineer', label: 'Engineer', clientRate: 190 },
        { key: 'pm', label: 'Project Manager', clientRate: 165 }
      ]
    }
  ]);
  const costCodes = ref([
    { code: 'LAB', label: 'Labor' },
    { code: 'MAT', label: 'Materials' },
    { code: 'TRV', label: 'Travel' },
    { code: 'OTH', label: 'Other Fees' }
  ]);
  const currentId = ref(null);

  // --- Seeds (Phase 9) ---
  function seedIfEmpty() {
    if (estimates.value.length) return;
    const seed = [
      {
        id: 'EST-1001',
        clientName: 'Acme Corporation',
        projectName: 'Network Infrastructure Upgrade',
        pricingMode: 'Fixed',
        targetMarginPct: 42,
        status: 'Draft',
        siteCount: 1,
        lineItems: [
          { pricingType: 'Fixed', category: 'Materials', description: 'Switches & routers', vendor: 'ABC Supplies Co.', quantity: 1, unitCost: 6200, margin: 35 },
          { pricingType: 'Fixed', category: 'Labor', description: 'Install & config', quantity: 24, unitCost: 85, margin: 50 }
        ],
        surveys: [],
        documents: [],
        versions: [],
        owner: 'Unassigned',
        updatedAt: new Date().toISOString(),
        history: []
      },
      {
        id: 'EST-1002',
        clientName: 'TechSolutions Inc.',
        projectName: 'Server Room Installation',
        pricingMode: 'Hybrid',
        targetMarginPct: 42,
        status: 'Submitted',
        siteCount: 2,
        lineItems: [
          { pricingType: 'Fixed', category: 'Materials', description: 'Racks & PDUs', quantity: 2, unitCost: 2800, margin: 40 },
          { pricingType: 'T&M', category: 'Labor', description: 'Cabling & cleanup', quantity: 16, unitCost: 80, clientRate: 145 }
        ],
        surveys: [ { id: newSurveyId(1), vendor: 'Local Contractor Services', status: 'Completed', estimatedCost: 680 } ],
        documents: [],
        versions: [],
        owner: 'Unassigned',
        updatedAt: new Date().toISOString(),
        history: []
      },
      {
        id: 'EST-1003',
        clientName: 'Global Retail',
        projectName: 'POS System Deployment',
        pricingMode: 'Fixed',
        targetMarginPct: 42,
        status: 'Approved',
        siteCount: 5,
        lineItems: [
          { pricingType: 'Fixed', category: 'Materials', description: 'POS terminals', quantity: 5, unitCost: 2200, margin: 38 },
          { pricingType: 'Fixed', category: 'Labor', description: 'Onsite setup (per store)', quantity: 5, unitCost: 650, margin: 45 }
        ],
        surveys: [],
        documents: [],
        versions: [],
        owner: 'Unassigned',
        updatedAt: new Date().toISOString(),
        history: []
      },
      {
        id: 'EST-1004',
        clientName: 'Healthcare Partners',
        projectName: 'Security System Installation',
        pricingMode: 'Fixed',
        targetMarginPct: 42,
        status: 'Rejected',
        siteCount: 1,
        lineItems: [
          { pricingType: 'Fixed', category: 'Materials', description: 'Cameras & NVR', quantity: 1, unitCost: 9500, margin: 30 }
        ],
        surveys: [],
        documents: [],
        versions: [],
        owner: 'Unassigned',
        updatedAt: new Date().toISOString(),
        history: []
      },
      {
        id: 'EST-1005',
        clientName: 'Financial Services Group',
        projectName: 'Data Center Migration',
        pricingMode: 'T&M',
        targetMarginPct: 42,
        status: 'Awaiting Approval',
        siteCount: 1,
        lineItems: [
          { pricingType: 'T&M', category: 'Labor', description: 'Migration support', quantity: 80, unitCost: 95, clientRate: 185 }
        ],
        surveys: [],
        documents: [],
        versions: [],
        owner: 'Unassigned',
        updatedAt: new Date().toISOString(),
        history: []
      }
    ];

    seed.forEach(e => recalcTotals(e));
    estimates.value = seed;
  }

  // --- Getters / selectors ---
  const list = computed(() => estimates.value);
  const current = computed(() => estimates.value.find(e => e.id === currentId.value) || null);

  const metrics = computed(() => {
    const counts = { open: 0, surveysScheduled: 0, awaitingApproval: 0 };
    counts.open = estimates.value.filter(e => ['Draft', 'Submitted', 'Client Sent'].includes(e.status)).length;
    counts.surveysScheduled = estimates.value.reduce((acc, e) => acc + (e.surveys || []).filter(s => s.status === 'Scheduled').length, 0);
    counts.awaitingApproval = estimates.value.filter(e => e.status === 'Awaiting Approval').length;
    return counts;
  });

  function findById(id) {
    return estimates.value.find(e => e.id === id) || null;
  }

  function query({ statuses = [], search = '' } = {}) {
    const term = search?.toLowerCase().trim();
    return estimates.value.filter(e => {
      const statusOk = !statuses.length || statuses.includes(e.status);
      const text = `${e.clientName} ${e.projectName} ${e.id}`.toLowerCase();
      const searchOk = !term || text.includes(term);
      return statusOk && searchOk;
    });
  }

  // --- Mutations / actions ---
  function setCurrent(id) { currentId.value = id; }
  function clearCurrent() { currentId.value = null; }

  function createEstimate(payload = {}) {
    const id = newEstimateId();
    const est = {
      id,
      clientName: payload.clientName || '',
      projectName: payload.projectName || '',
      pricingMode: payload.pricingMode || 'Fixed',
      rateCardId: payload.rateCardId || null,
      targetMarginPct: payload.targetMarginPct ?? 42,
      status: 'Draft',
      siteCount: payload.siteCount ?? 1,
      sites: payload.sites || [],
      lineItems: payload.lineItems || [],
      surveys: [],
      documents: [],
      versions: [],
      approvalStatus: 'none',
      approvalReason: '',
      acceptedAt: null,
      owner: 'Unassigned',
      updatedAt: new Date().toISOString(),
      history: []
    };
    recalcTotals(est);
    estimates.value.unshift(est);
    return est;
  }

  function updateEstimate(id, patch) {
    const est = findById(id);
    if (!est) return null;
    Object.assign(est, patch || {});
    est.updatedAt = new Date().toISOString();
    recalcTotals(est);
    return est;
  }

  function duplicateEstimate(id) {
    const original = findById(id);
    if (!original) return null;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = newEstimateId();
    copy.status = 'Draft';
    copy.versions = [];
    copy.updatedAt = new Date().toISOString();
    estimates.value.unshift(copy);
    return copy;
  }

  function deleteEstimate(id) {
    const idx = estimates.value.findIndex(e => e.id === id);
    if (idx >= 0) estimates.value.splice(idx, 1);
  }

  // Internal: append a history event (front-end mock)
  function logEvent(est, type, detail = '') {
    if (!est) return;
    est.history = est.history || [];
    est.history.unshift({ id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, type, detail, at: new Date().toISOString() });
  }

  function addLineItem(estimateId, item) {
    const est = findById(estimateId);
    if (!est) return;
    est.lineItems.push({ ...item });
    est.updatedAt = new Date().toISOString();
    recalcTotals(est);
    logEvent(est, 'line_item.add', item.description || 'Line item');
  }

  function updateLineItem(estimateId, itemId, patch) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = est.lineItems.findIndex(i => i.id === itemId);
    if (idx >= 0) {
      est.lineItems[idx] = { ...est.lineItems[idx], ...patch };
      est.updatedAt = new Date().toISOString();
      recalcTotals(est);
      logEvent(est, 'line_item.update', est.lineItems[idx].description || 'Line item');
    }
  }

  function deleteLineItem(estimateId, itemId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = est.lineItems.findIndex(i => i.id === itemId);
    if (idx >= 0) {
      const [removed] = est.lineItems.splice(idx, 1);
      est.updatedAt = new Date().toISOString();
      recalcTotals(est);
      logEvent(est, 'line_item.delete', removed?.description || 'Line item');
    }
  }

  function addSurvey(estimateId, survey) {
    const est = findById(estimateId);
    if (!est) return;
    const id = survey?.id || newSurveyId((est.surveys?.length || 0) + 1);
    const s = { id, status: 'Requested', ...survey };
    est.surveys = est.surveys || [];
    est.surveys.push(s);
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'survey.add', `${s.id} ${s.vendor || ''}`.trim());
  }

  // Bids
  function addBid(estimateId, bid) {
    const est = findById(estimateId);
    if (!est) return;
    est.bids = est.bids || [];
    const id = bid?.id || `BID-${Date.now()}`;
    est.bids.push({ id, status: 'Received', ...bid });
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bid.add', `${bid.vendor_name || ''} ${bid.bid_name || ''}`.trim());
  }

  function updateBid(estimateId, bidId, patch) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.bids || []).findIndex(b => b.id === bidId);
    if (idx >= 0) {
      est.bids[idx] = { ...est.bids[idx], ...patch };
      est.updatedAt = new Date().toISOString();
    }
  }

  function deleteBid(estimateId, bidId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.bids || []).findIndex(b => b.id === bidId);
    if (idx >= 0) {
      const [removed] = est.bids.splice(idx, 1);
      est.updatedAt = new Date().toISOString();
      logEvent(est, 'bid.delete', removed?.bid_name || removed?.id || 'Bid');
    }
  }

  function selectBidForLineItem(estimateId, bidId) {
    const est = findById(estimateId);
    if (!est) return;
    const bid = (est.bids || []).find(b => b.id === bidId);
    if (!bid) return;
    const item = {
      id: Date.now(),
      pricingType: 'Fixed',
      category: 'Materials',
      description: bid.bid_name || bid.notes || 'Vendor Bid',
      vendor: bid.vendor_name || bid.vendor || '',
      unit: 'ea',
      quantity: 1,
      unitCost: Number(bid.bid_amount) || 0,
      margin: 35
    };
    est.lineItems.push(item);
    bid.status = 'Selected';
    est.updatedAt = new Date().toISOString();
    recalcTotals(est);
    logEvent(est, 'bid.select', bid.bid_name || bid.id);
  }

  // Documents
  function addDocument(estimateId, doc) {
    const est = findById(estimateId);
    if (!est) return;
    est.documents = est.documents || [];
    const id = doc?.id || `DOC-${Date.now()}`;
    est.documents.push({ id, uploadedAt: new Date().toISOString(), version: 1, ...doc });
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'doc.add', doc?.name || id);
  }

  function deleteDocument(estimateId, docId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.documents || []).findIndex(d => d.id === docId);
    if (idx >= 0) {
      const [removed] = est.documents.splice(idx, 1);
      est.updatedAt = new Date().toISOString();
      logEvent(est, 'doc.delete', removed?.name || docId);
    }
  }

  function setStatus(id, status) {
    const est = findById(id);
    if (!est) return;
    est.status = status;
    est.updatedAt = new Date().toISOString();
  }

  function snapshotVersion(id) {
    const est = findById(id);
    if (!est) return null;
    const tag = nextVersionTag(est.versions?.map(v => v.tag) || []);
    const snapshot = {
      tag,
      createdAt: new Date().toISOString(),
      header: {
        clientName: est.clientName,
        projectName: est.projectName,
        siteCount: est.siteCount,
        pricingMode: est.pricingMode,
        targetMarginPct: est.targetMarginPct
      },
      lineItems: JSON.parse(JSON.stringify(est.lineItems || [])),
      totals: est.totals,
      status: 'Sent'
    };
    est.versions = est.versions || [];
    // Add newest version to the front
    est.versions.unshift(snapshot);
    // Mark prior versions as Superseded (preserve any Accepted snapshot)
    for (let i = 1; i < est.versions.length; i += 1) {
      const v = est.versions[i];
      if (v && v.status !== 'Accepted' && v.status !== 'Superseded') {
        est.versions[i] = { ...v, status: 'Superseded' };
      }
    }
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'version.snapshot', snapshot.tag);
    return snapshot;
  }

  function requestApproval(id, reason = '') {
    const est = findById(id);
    if (!est) return;
    est.approvalStatus = 'requested';
    est.approvalReason = reason || 'Margin below target';
    // Reflect overall estimate status for metrics/UX
    setStatus(id, 'Awaiting Approval');
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'approval.requested', est.approvalReason);
  }

  function setApprovalStatus(id, status) {
    const est = findById(id);
    if (!est) return;
    if (!['approved','rejected','none','requested'].includes(status)) return;
    est.approvalStatus = status;
    // Sync estimate status to mirror the approval decision (front-end mock)
    if (status === 'approved') {
      setStatus(id, 'Approved');
    } else if (status === 'rejected') {
      setStatus(id, 'Draft');
    }
    est.updatedAt = new Date().toISOString();
    logEvent(est, `approval.${status}`);
  }

  function sendToClient(id) {
    const est = findById(id);
    if (!est) return null;
    const snap = snapshotVersion(id);
    est.status = 'Client Sent';
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'quote.sent', snap?.tag || 'V1');
    return snap;
  }

  function markAccepted(id, versionTag = null) {
    const est = findById(id);
    if (!est) return;
    est.status = 'Accepted';
    est.acceptedAt = new Date().toISOString();
    if (versionTag && Array.isArray(est.versions)) {
      est.versions = est.versions.map(v => v.tag === versionTag ? { ...v, status: 'Accepted' } : v);
    }
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'quote.accepted', versionTag || 'V?');
  }

  // --- Totals ---
  function recalcTotals(est) {
    const { cost, charge, marginAmt, marginPct } = sumLineItems(est.lineItems || []);
    const perSite = { cost: round2(cost), charge: round2(charge), marginAmt: round2(marginAmt), marginPct: round2(marginPct) };
    const sites = Number(est.siteCount) || (Array.isArray(est.sites) && est.sites.length) || 1;
    const grand = { cost: round2(perSite.cost * sites), charge: round2(perSite.charge * sites) };
    grand.marginAmt = round2(grand.charge - grand.cost);
    grand.marginPct = grand.charge > 0 ? round2((grand.marginAmt / grand.charge) * 100) : 0;

    est.totals = { perSite, grand };
    // Guardrail
    est.requiresApproval = (est.targetMarginPct ?? 0) > 0 && perSite.marginPct < est.targetMarginPct;
  }

  // Sites helpers
  function addSite(estimateId, site) {
    const est = findById(estimateId);
    if (!est) return;
    est.sites = est.sites || [];
    const id = site?.id || Date.now();
    est.sites.push({ id, ...site });
    est.siteCount = est.sites.length;
    est.updatedAt = new Date().toISOString();
    recalcTotals(est);
  }

  function updateSite(estimateId, siteId, patch) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.sites || []).findIndex(s => s.id === siteId);
    if (idx >= 0) {
      est.sites[idx] = { ...est.sites[idx], ...patch };
      est.siteCount = est.sites.length;
      est.updatedAt = new Date().toISOString();
      recalcTotals(est);
    }
  }

  function deleteSite(estimateId, siteId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.sites || []).findIndex(s => s.id === siteId);
    if (idx >= 0) {
      est.sites.splice(idx, 1);
      est.siteCount = est.sites.length || 1;
      est.updatedAt = new Date().toISOString();
      recalcTotals(est);
    }
  }

  // Initialize seeds once
  seedIfEmpty();

  return {
    // state
    estimates,
    vendors,
    rateCards,
    costCodes,
    currentId,
    // getters
    list,
    current,
    metrics,
    findById,
    query,
    // actions
    setCurrent,
    clearCurrent,
    createEstimate,
    updateEstimate,
    duplicateEstimate,
    deleteEstimate,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    addSurvey,
    addSite,
    updateSite,
    deleteSite,
    addBid,
    updateBid,
    deleteBid,
    selectBidForLineItem,
    addDocument,
    deleteDocument,
    requestApproval,
    setApprovalStatus,
    sendToClient,
    markAccepted,
    setStatus,
    snapshotVersion,
    recalcTotals
  };
});
