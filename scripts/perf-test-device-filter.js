// Simple perf test that simulates filtering over 1k devices and logs timings.
// Run with: node scripts/perf-test-device-filter.js

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateDevices(n = 1000) {
  const brands = ['Xiaomi', 'Samsung', 'OnePlus', 'Vivo', 'Oppo', 'Motorola'];
  const notes = ['HIGH BALANCE', 'LOW BALANCE', 'CASHOUT DONE', 'NO BANK', '', '', ''];
  const statuses = ['Online', 'Offline', 'Unknown'];
  const devices = {};
  for (let i = 0; i < n; i++) {
    const id = `DEV-${String(i + 1).padStart(4, '0')}`;
    const added = new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 30).toISOString();
    devices[id] = {
      Brand: randomItem(brands),
      Model: `${randomItem(brands)} Model ${Math.floor(Math.random() * 100)}`,
      Note: randomItem(notes),
      Status: randomItem(statuses),
      IPAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      AndroidVersion: String(8 + Math.floor(Math.random() * 6)),
      Added: added
    };
  }
  return devices;
}

function toTimestamp(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function filterDevices({ devices, searchTerm = '', statusFilter = 'all', availabilityFilter = 'all', notesFilter = 'all', order = 'desc', upiMap = {} }) {
  const searchLower = searchTerm.toLowerCase();
  const entries = Object.entries(devices);
  const t0 = performance.now();

  const filtered = entries.filter(([id, device]) => {
    const searchMatch = searchTerm === '' || (
      id.toLowerCase().includes(searchLower) ||
      (device.Brand || '').toLowerCase().includes(searchLower) ||
      (device.Model || '').toLowerCase().includes(searchLower) ||
      (device.Note || '').toLowerCase().includes(searchLower) ||
      (device.IPAddress || '').toLowerCase().includes(searchLower)
    );
    if (!searchMatch) return false;

    const currentStatus = device.Status || 'Unknown';
    const statusMatch = statusFilter === 'all' || currentStatus === statusFilter;
    if (!statusMatch) return false;

    const upiPins = upiMap[id] || [];
    const hasValidPin = upiPins.length > 0 && upiPins.some((p) => (typeof p === 'string' ? p !== 'No Pin' : p && p.pin && p.pin !== 'No Pin'));
    const availabilityMatch = availabilityFilter === 'all' ||
      (availabilityFilter === 'noPin' && !hasValidPin) ||
      (availabilityFilter === 'hasPin' && hasValidPin);
    if (!availabilityMatch) return false;

    const hasNote = device.Note && device.Note.trim() !== '';
    const notesMatch = notesFilter === 'all' || (notesFilter === 'hasNote' && hasNote) || (notesFilter === 'noNote' && !hasNote);
    return notesMatch;
  });

  const t1 = performance.now();

  const direction = order === 'desc' ? -1 : 1;
  filtered.sort(([, a], [, b]) => direction * (toTimestamp(a.Added) - toTimestamp(b.Added)));

  const t2 = performance.now();

  return { count: filtered.length, filterMs: (t1 - t0).toFixed(2), sortMs: (t2 - t1).toFixed(2), totalMs: (t2 - t0).toFixed(2) };
}

async function main() {
  const { performance } = await import('node:perf_hooks');
  global.performance = performance;
  const devices = generateDevices(1000);
  const upiMap = {};

  const scenarios = [
    { name: 'Empty search', searchTerm: '' },
    { name: 'Search by brand', searchTerm: 'xiaomi' },
    { name: 'Search by model', searchTerm: 'model 1' },
    { name: 'Filter Online', statusFilter: 'Online' },
    { name: 'Filter hasPin', availabilityFilter: 'hasPin' },
    { name: 'Filter notes hasNote', notesFilter: 'hasNote' },
  ];

  for (const s of scenarios) {
    const r = filterDevices({ devices, upiMap, ...s });
    console.log(`${s.name}: count=${r.count}, filterMs=${r.filterMs}ms, sortMs=${r.sortMs}ms, totalMs=${r.totalMs}ms`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
