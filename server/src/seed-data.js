import { db } from './db.js';

export function seedDemo() {
  db.exec('DELETE FROM job_updates; DELETE FROM job_tasks; DELETE FROM jobs; DELETE FROM vehicles; DELETE FROM customers;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('job_updates','job_tasks','jobs','vehicles','customers');");

  const addCustomer = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
  const addVehicle = db.prepare(
    'INSERT INTO vehicles (customer_id, reg_no, make, model, year, color) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const addJob = db.prepare(
    `INSERT INTO jobs (vehicle_id, service_type, description, stage_index, estimated_delivery, cost_estimate, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now'), ?)`
  );
  const addTask = db.prepare('INSERT INTO job_tasks (job_id, title, done, done_at, sort) VALUES (?, ?, ?, ?, ?)');
  const addUpdate = db.prepare(
    "INSERT INTO job_updates (job_id, stage_index, message, created_at) VALUES (?, ?, ?, datetime('now', ?))"
  );

  // --- customers & vehicles ---
  const arjun = addCustomer.run('Arjun Menon', '9847012345').lastInsertRowid;
  const fathima = addCustomer.run('Fathima Rasheed', '9745098765').lastInsertRowid;
  const vishnu = addCustomer.run('Vishnu Prasad', '9656011223').lastInsertRowid;

  const creta = addVehicle.run(arjun, 'KL18AB1234', 'Hyundai', 'Creta', 2022, 'Phantom Black').lastInsertRowid;
  const benz = addVehicle.run(fathima, 'KL18CD5678', 'Mercedes-Benz', 'C 200', 2023, 'Polar White').lastInsertRowid;
  const swift = addVehicle.run(vishnu, 'KL18EF9012', 'Maruti Suzuki', 'Swift', 2019, 'Fire Red').lastInsertRowid;
  const defender = addVehicle.run(vishnu, 'KL11GH3456', 'Land Rover', 'Defender', 2021, 'Gondwana Stone').lastInsertRowid;

  // --- job 1: Creta ceramic coating, mid-service ---
  const j1 = addJob.run(
    creta,
    'Ceramic Coating',
    '9H ceramic coating full body with 2-step paint correction and wheel coating.',
    2,
    '2026-06-15',
    24500,
    '-3 days',
    null
  ).lastInsertRowid;
  [
    ['Foam wash & clay bar decontamination', 1],
    ['Paint inspection & swirl mapping', 1],
    ['2-step machine paint correction', 1],
    ['Ceramic coat — body panels (layer 1)', 0],
    ['Ceramic coat — body panels (layer 2)', 0],
    ['Wheel & caliper coating', 0],
    ['IR curing & final inspection', 0],
  ].forEach(([title, done], i) => addTask.run(j1, title, done, done ? new Date().toISOString() : null, i));
  addUpdate.run(j1, 0, 'Vehicle received at PITLANE. Service initiated.', '-3 days');
  addUpdate.run(j1, 1, 'Inspection complete. Moderate swirl marks on bonnet and boot — 2-step correction recommended and approved.', '-2 days');
  addUpdate.run(j1, 2, 'Paint correction completed. Surface prepped for coating — first ceramic layer goes on tomorrow morning.', '-1 days');

  // --- job 2: C 200 PPF, quality check ---
  const j2 = addJob.run(
    benz,
    'Paint Protection Film',
    'Full-front PPF kit: bonnet, fenders, bumper, mirrors + door edge guards.',
    3,
    '2026-06-13',
    68000,
    '-6 days',
    null
  ).lastInsertRowid;
  [
    ['Decontamination wash & surface prep', 1],
    ['Panel measurement & film plotting', 1],
    ['PPF application — bonnet & fenders', 1],
    ['PPF application — bumper & mirrors', 1],
    ['Edge sealing & heat forming', 1],
    ['Final quality inspection', 0],
  ].forEach(([title, done], i) => addTask.run(j2, title, done, done ? new Date().toISOString() : null, i));
  addUpdate.run(j2, 0, 'Vehicle received at PITLANE. Service initiated.', '-6 days');
  addUpdate.run(j2, 1, 'Film plotted and cut for all front panels. Premium gloss PPF as discussed.', '-4 days');
  addUpdate.run(j2, 2, 'PPF applied on bonnet, fenders, bumper and mirrors. Edges sealed.', '-2 days');
  addUpdate.run(j2, 3, 'Application complete — vehicle moved to quality check. Delivery expected on schedule.', '-1 days');

  // --- job 3: Swift respray, inspection ---
  const j3 = addJob.run(
    swift,
    'Custom Paint & Respray',
    'Full respray in custom candy red with clear coat. Minor dent repair on left rear door.',
    1,
    '2026-06-24',
    85000,
    '-1 days',
    null
  ).lastInsertRowid;
  [
    ['Dent assessment — left rear door', 0],
    ['Surface sanding & masking', 0],
    ['Primer & base coat', 0],
    ['Candy red paint application', 0],
    ['Clear coat & polishing', 0],
  ].forEach(([title, done], i) => addTask.run(j3, title, done, null, i));
  addUpdate.run(j3, 0, 'Vehicle received at PITLANE. Service initiated.', '-1 days');
  addUpdate.run(j3, 1, 'Initial inspection underway. Paint codes matched; estimate shared on WhatsApp for approval.', '-2 hours');

  // --- job 4: Defender ice blasting, delivered last month ---
  const j4 = addJob.run(
    defender,
    'Ice Blasting',
    'Full underbody dry-ice cleaning and corrosion protection.',
    5,
    '2026-05-12',
    18000,
    '-32 days',
    new Date('2026-05-12T11:30:00Z').toISOString()
  ).lastInsertRowid;
  [
    ['Underbody inspection', 1],
    ['Dry ice blasting — chassis & arches', 1],
    ['Anti-corrosion coating', 1],
    ['Final inspection & handover', 1],
  ].forEach(([title, done], i) => addTask.run(j4, title, done, new Date().toISOString(), i));
  addUpdate.run(j4, 0, 'Vehicle received at PITLANE. Service initiated.', '-32 days');
  addUpdate.run(j4, 2, 'Underbody blasting complete. Factory-fresh chassis — photos shared.', '-30 days');
  addUpdate.run(j4, 5, 'Vehicle delivered. Thank you for choosing PITLANE!', '-29 days');
}
