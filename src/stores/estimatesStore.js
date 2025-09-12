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
        history: [],
        bidTracks: [
          {
            id: 'BT-2001', vendor_name: 'Vendor Co', category: 'Materials', subject: 'Cabling kit',
            createdAt: new Date().toISOString(), expectedAt: null, dueAt: null, receivedAt: new Date().toISOString(),
            status: 'Selected', surveyIds: [], selectedVersionTag: 'B1', documents: [],
            versions: [ { tag:'B1', received_date: new Date().toISOString(), amount: 1200, status:'Selected', docId:null, attachmentDocIds:[], items: [] } ]
          },
          {
            id: 'BT-2002', vendor_name: 'Local Contractor Services', category: 'Labor', subject: 'Install labor',
            createdAt: new Date().toISOString(), expectedAt: null, dueAt: null, receivedAt: null,
            status: 'Requested', surveyIds: [], selectedVersionTag: null, documents: [], versions: []
          }
        ],
        notes: [],
        pricingComplete: false
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
      bidTracks: [],
      notes: [],
      pricingComplete: false,
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

  // --- Bid Tracking Helpers ---
  function nextBidVersionTag(existing = []) {
    const nums = (existing || [])
      .map(v => (typeof v === 'string' && /^B\d+$/.test(v) ? Number(v.slice(1)) : 0))
      .filter(Boolean);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `B${next}`;
  }

  // --- Notes ---
  function addNote(estimateId, note) {
    const est = findById(estimateId);
    if (!est) return;
    est.notes = est.notes || [];
    const n = { id: `NOTE-${Date.now()}`, at: new Date().toISOString(), ...note };
    est.notes.unshift(n);
    logEvent(est, 'note.add', note?.text?.slice(0, 80) || '');
  }
  function deleteNote(estimateId, noteId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.notes || []).findIndex(n => n.id === noteId);
    if (idx >= 0) est.notes.splice(idx, 1);
  }

  // --- Bid Tracks ---
  function createBidTrack(estimateId, payload) {
    const est = findById(estimateId);
    if (!est) return null;
    est.bidTracks = est.bidTracks || [];
    const bt = {
      id: `BT-${Date.now()}`,
      vendor_name: payload.vendor_name || '',
      category: payload.category || 'Materials',
      subject: payload.subject || '',
      createdAt: new Date().toISOString(),
      expectedAt: payload.expectedAt || null,
      dueAt: payload.dueAt || null,
      receivedAt: null,
      status: 'Requested', // Requested | Pending Vendor | Received | Selected | Not Selected | Cancelled
      surveyIds: [],
      versions: [],
      selectedVersionTag: null,
      documents: []
    };
    est.bidTracks.unshift(bt);
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidtrack.create', `${bt.vendor_name} ${bt.subject}`.trim());
    return bt;
  }

  function updateBidTrack(estimateId, bidTrackId, patch) {
    const est = findById(estimateId);
    if (!est) return null;
    const idx = (est.bidTracks || []).findIndex(b => b.id === bidTrackId);
    if (idx < 0) return null;
    est.bidTracks[idx] = { ...est.bidTracks[idx], ...patch };
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidtrack.update', est.bidTracks[idx].subject || est.bidTracks[idx].id);
    return est.bidTracks[idx];
  }

  function deleteBidTrack(estimateId, bidTrackId) {
    const est = findById(estimateId);
    if (!est) return;
    const idx = (est.bidTracks || []).findIndex(b => b.id === bidTrackId);
    if (idx >= 0) {
      const [removed] = est.bidTracks.splice(idx, 1);
      est.updatedAt = new Date().toISOString();
      logEvent(est, 'bidtrack.delete', removed?.subject || bidTrackId);
    }
  }

  function addBidVersion(estimateId, bidTrackId, payload) {
    const est = findById(estimateId);
    if (!est) return null;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return null;
    const tag = nextBidVersionTag(bt.versions?.map(v => v.tag) || []);
    const v = {
      tag,
      received_date: payload.received_date || new Date().toISOString(),
      amount: Number(payload.amount) || 0,
      status: 'Received', // Received | Selected | Superseded
      docId: payload.docId || null,
      attachmentDocIds: payload.attachmentDocIds || [],
      items: payload.items ? JSON.parse(JSON.stringify(payload.items)) : []
    };
    bt.versions = bt.versions || [];
    bt.versions.unshift(v);
    bt.receivedAt = v.received_date;
    bt.status = 'Received';
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidversion.add', `${bt.vendor_name} ${bt.subject} ${tag}`.trim());
    return v;
  }

  function setBidStatus(estimateId, bidTrackId, status) {
    const est = findById(estimateId);
    if (!est) return;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return;
    bt.status = status;
    if (status === 'Received') bt.receivedAt = new Date().toISOString();
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidtrack.status', `${bt.id} -> ${status}`);
  }

  function selectWinningBidVersion(estimateId, bidTrackId, versionTag) {
    const est = findById(estimateId);
    if (!est) return;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return;
    bt.selectedVersionTag = versionTag || null;
    (bt.versions || []).forEach(v => {
      v.status = v.tag === versionTag ? 'Selected' : (v.status === 'Selected' ? 'Received' : v.status);
    });
    bt.status = versionTag ? 'Selected' : bt.status;
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidversion.select', `${bt.id} -> ${versionTag || 'none'}`);
  }

  function deleteBidVersion(estimateId, bidTrackId, versionTag) {
    const est = findById(estimateId);
    if (!est) return false;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return false;
    const idx = (bt.versions || []).findIndex(v => v.tag === versionTag);
    if (idx < 0) return false;
    const [removed] = bt.versions.splice(idx, 1);
    if (bt.selectedVersionTag === versionTag) bt.selectedVersionTag = null;
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidversion.delete', `${bt.id}/${versionTag}`);
    return true;
  }

  function updateBidVersion(estimateId, bidTrackId, versionTag, patch) {
    const est = findById(estimateId);
    if (!est) return null;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return null;
    const vIdx = (bt.versions || []).findIndex(x => x.tag === versionTag);
    if (vIdx < 0) return null;
    bt.versions[vIdx] = { ...bt.versions[vIdx], ...patch };
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidversion.update', `${bt.id}/${versionTag}`);
    return bt.versions[vIdx];
  }

  function setBidVersionItems(estimateId, bidTrackId, versionTag, items = []) {
    const est = findById(estimateId);
    if (!est) return null;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return null;
    const v = (bt.versions || []).find(x => x.tag === versionTag);
    if (!v) return null;
    v.items = JSON.parse(JSON.stringify(items || []));
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'bidversion.items.set', `${bt.id}/${versionTag} (${v.items.length})`);
    return v.items;
  }

  function linkDocToBid(estimateId, bidTrackId, docId) {
    const est = findById(estimateId);
    if (!est) return;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return;
    bt.documents = bt.documents || [];
    if (!bt.documents.includes(docId)) bt.documents.push(docId);
    const doc = (est.documents || []).find(d => d.id === docId);
    if (doc) doc.linkedTo = { type: 'bid', id: bidTrackId };
    logEvent(est, 'doc.link.bid', `${docId} -> ${bidTrackId}`);
  }

  function linkDocToBidVersion(estimateId, bidTrackId, versionTag, docId) {
    const est = findById(estimateId);
    if (!est) return;
    const bt = (est.bidTracks || []).find(b => b.id === bidTrackId);
    if (!bt) return;
    const v = (bt.versions || []).find(x => x.tag === versionTag);
    if (!v) return;
    v.attachmentDocIds = v.attachmentDocIds || [];
    if (!v.attachmentDocIds.includes(docId)) v.attachmentDocIds.push(docId);
    const doc = (est.documents || []).find(d => d.id === docId);
    if (doc) doc.linkedTo = { type: 'bidVersion', id: bidTrackId, tag: versionTag };
    logEvent(est, 'doc.link.bidVersion', `${docId} -> ${bidTrackId}/${versionTag}`);
  }

  function convertWinningBidsToLineItems(estimateId) {
    const est = findById(estimateId);
    if (!est) return 0;
    let added = 0;
    (est.bidTracks || []).forEach(bt => {
      if (!bt.selectedVersionTag) return;
      const v = (bt.versions || []).find(x => x.tag === bt.selectedVersionTag);
      if (!v) return;
      if (v.items && v.items.length) {
        v.items.forEach(item => {
          est.lineItems.push({ ...item, vendor: bt.vendor_name, id: Date.now() + Math.random() });
          added += 1;
        });
      } else if (v.amount > 0) {
        est.lineItems.push({
          id: Date.now() + Math.random(),
          pricingType: 'Fixed',
          category: bt.category || 'Materials',
          description: `Vendor Bid - ${bt.vendor_name} (${bt.subject || bt.id})`,
          vendor: bt.vendor_name || '',
          unit: 'ea',
          quantity: 1,
          unitCost: Number(v.amount) || 0,
          margin: 35
        });
        added += 1;
      }
    });
    if (added) {
      est.updatedAt = new Date().toISOString();
      recalcTotals(est);
      logEvent(est, 'bid.convert', `${added} item(s)`);
    }
    return added;
  }

  function setPricingComplete(estimateId, flag = true) {
    const est = findById(estimateId);
    if (!est) return;
    est.pricingComplete = !!flag;
    est.updatedAt = new Date().toISOString();
    logEvent(est, 'pricing.complete', String(est.pricingComplete));
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
    // bid tracks
    createBidTrack,
    updateBidTrack,
    deleteBidTrack,
    addBidVersion,
    setBidStatus,
    selectWinningBidVersion,
    linkDocToBid,
    linkDocToBidVersion,
    convertWinningBidsToLineItems,
    updateBidVersion,
    setBidVersionItems,
    setPricingComplete,
    // notes
    addNote,
    deleteNote,
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
