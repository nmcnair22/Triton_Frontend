// Money & percent helpers with safe rounding to two decimals
// Note: we avoid external big-decimal deps; do cents arithmetic where possible.

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function toCents(n) {
  if (n === null || n === undefined || n === '') return 0;
  const num = typeof n === 'string' ? Number(String(n).replace(/[^0-9.-]/g, '')) : Number(n);
  if (!isFinite(num)) return 0;
  return Math.round(num * 100);
}

export function fromCents(cents) {
  return (Number(cents) || 0) / 100;
}

export function addCents(...args) {
  return args.reduce((sum, v) => sum + (Number(v) || 0), 0);
}

export function mulToCents(a, b) {
  // Multiply two decimals and return integer cents
  const result = Number(a) * Number(b);
  return toCents(result);
}

export function formatCurrency(amount, { currency = 'USD', locale = 'en-US', maximumFractionDigits = 2 } = {}) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

export function formatPercent(pct, { digits = 2 } = {}) {
  const n = Number(pct) || 0;
  return `${n.toFixed(digits)}%`;
}

// Canonical math for Fixed pricing
export function clientChargeFromMargin(totalCost, marginPct) {
  const m = Number(marginPct) / 100;
  if (!isFinite(m) || m <= 0) return round2(Number(totalCost) || 0);
  if (m >= 1) return Infinity; // avoid divide by zero
  return round2((Number(totalCost) || 0) / (1 - m));
}

export function marginFromClientCharge(totalCost, clientCharge) {
  const charge = Number(clientCharge) || 0;
  if (charge <= 0) return 0;
  const cost = Number(totalCost) || 0;
  return round2(((charge - cost) / charge) * 100);
}

// T&M helpers
export function tmClientCharge(qty, clientRate) {
  return round2((Number(qty) || 0) * (Number(clientRate) || 0));
}

export function tmMarginPct(unitCost, clientRate) {
  const cr = Number(clientRate) || 0;
  if (cr <= 0) return 0;
  const uc = Number(unitCost) || 0;
  return round2(((cr - uc) / cr) * 100);
}

// Aggregate helpers
export function sumLineItems(lineItems) {
  // Expects items with quantity, unitCost, margin (for Fixed) and/or clientRate (for T&M)
  const totalCostCents = lineItems.reduce((sum, item) => {
    return sum + mulToCents(item.quantity || 0, item.unitCost || 0);
  }, 0);

  const totalClientCharge = lineItems.reduce((sum, item) => {
    const cost = (item.quantity || 0) * (item.unitCost || 0);
    let charge = cost;
    if (item.pricingType === 'T&M') {
      charge = tmClientCharge(item.quantity || 0, item.clientRate || 0);
    } else {
      charge = clientChargeFromMargin(cost, item.margin || 0);
    }
    return sum + charge;
  }, 0);

  const cost = fromCents(totalCostCents);
  const charge = round2(totalClientCharge);
  const marginAmt = round2(charge - cost);
  const marginPct = charge > 0 ? round2((marginAmt / charge) * 100) : 0;

  return { cost, charge, marginAmt, marginPct };
}

export function perSiteToGrand(perSite, siteCount) {
  const n = Number(siteCount) || 1;
  return {
    cost: round2(perSite.cost * n),
    charge: round2(perSite.charge * n),
    marginAmt: round2(perSite.marginAmt * n),
    marginPct: perSite.charge > 0 ? round2((perSite.marginAmt / perSite.charge) * 100) : 0
  };
}

