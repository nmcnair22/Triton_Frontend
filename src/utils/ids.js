// Lightweight ID helpers for mock/demo use

function pad(n, width = 3) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

export function generateId(prefix = 'ID') {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1, 2);
  const day = pad(d.getDate(), 2);
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${y}${m}${day}-${rand}`;
}

export function newEstimateId() {
  return generateId('EST');
}

export function newSurveyId(seq = null) {
  if (seq != null) return `SS-${pad(seq, 3)}`;
  return generateId('SS');
}

export function nextVersionTag(existing = []) {
  const nums = existing
    .map(v => (typeof v === 'string' && /^V\d+$/.test(v) ? Number(v.slice(1)) : 0))
    .filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `V${next}`;
}

