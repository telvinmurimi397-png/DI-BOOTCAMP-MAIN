// Seed the database with sample reports on first run (mirrors the frontend demo).

const db = require('./db');
const reports = require('./reports');

const SEED = [
  { id: 'MTF-2026-K2N7', cat: 'roads', ward: 'Kasarani', landmark: 'Near Kasarani Stadium gate B',
    desc: 'Huge pothole covering half the road on Kasarani–Mwiki road. Boda riders are swerving into oncoming traffic to avoid it.',
    name: 'James Mwangi', phone: '0712345678', status: 4, ageDays: 12 },
  { id: 'MTF-2026-P9Q4', cat: 'water', ward: "Kibera (Sarang'ombe)", landmark: 'Behind Toi Market',
    desc: 'Water pipe burst three days ago. Water is flowing into the road, and we have had no supply at home since yesterday.',
    name: 'Achieng O.', phone: '0722111222', status: 3, ageDays: 5 },
  { id: 'MTF-2026-D4F8', cat: 'lights', ward: 'Westlands', landmark: 'Parklands 5th Avenue',
    desc: 'Streetlights along 5th Avenue have been off for two weeks. The stretch is now unsafe at night, especially for women walking from work.',
    name: 'Fatuma Ali', phone: '0733444555', status: 2, ageDays: 3 },
  { id: 'MTF-2026-M6R2', cat: 'garbage', ward: 'Embakasi East', landmark: 'Nyayo Estate Phase 2 gate',
    desc: 'Garbage has not been collected for three weeks. The heap is now blocking part of the road and smells terrible.',
    name: 'Peter Njoroge', phone: '0744666777', status: 1, ageDays: 2 },
  { id: 'MTF-2026-W8T5', cat: 'drainage', ward: 'Mvita, Mombasa', landmark: 'Near Makadara Mosque',
    desc: 'Blocked drainage on Abdel Nasser Road. Every light rain floods the shops along the road.',
    name: 'Swaleh Omar', phone: '0755888999', status: 0, ageDays: 1 }
];

async function ensureSeed() {
  if (reports.count() > 0) return; // already has data
  const now = Date.now();
  for (const s of SEED) {
    const created = new Date(now - s.ageDays * 86400000).toISOString();
    db.run(
      `INSERT INTO reports (id, cat, ward, landmark, description, name, phone, photo, status, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      [s.id, s.cat, s.ward, s.landmark, s.desc, s.name, s.phone, s.status, created, created]
    );
    // build a simple status history up to the current status
    for (let i = 0; i <= s.status; i++) {
      db.run('INSERT INTO status_history (report_id, status, note, at) VALUES (?, ?, ?, ?)',
        [s.id, i, i === 0 ? 'Received by Mtaafix' : null, created]);
    }
  }
  console.log(`Seeded ${SEED.length} sample reports.`);
}

module.exports = { ensureSeed };

// allow `npm run seed`
if (require.main === module) {
  db.init().then(ensureSeed).then(() => process.exit(0));
}