import express from 'express';
import cors from 'cors';
import { db, STAGES, SERVICE_TYPES, normalizePhone, normalizeReg } from './db.js';
import { seedDemo } from './seed-data.js';

// Hosts with ephemeral disks (e.g. Render free tier) start with an empty DB —
// load the demo dataset so the app always has something to show. Set SEED_DEMO=0 off.
if (process.env.SEED_DEMO !== '0' && db.prepare('SELECT COUNT(*) AS n FROM customers').get().n === 0) {
  seedDemo();
  console.log('Empty database — demo data seeded.');
}

const app = express();
const PORT = process.env.PORT || 4000;
const STAFF_PIN = process.env.STAFF_PIN || '4321';

app.use(cors());
app.use(express.json());

// ---------- helpers ----------

function jobWithDetails(jobId) {
  const job = db
    .prepare(
      `SELECT j.*, v.reg_no, v.make, v.model, v.year, v.color, v.customer_id,
              c.name AS customer_name, c.phone AS customer_phone
       FROM jobs j
       JOIN vehicles v ON v.id = j.vehicle_id
       JOIN customers c ON c.id = v.customer_id
       WHERE j.id = ?`
    )
    .get(jobId);
  if (!job) return null;
  const tasks = db
    .prepare('SELECT * FROM job_tasks WHERE job_id = ? ORDER BY sort, id')
    .all(jobId);
  const updates = db
    .prepare('SELECT * FROM job_updates WHERE job_id = ? ORDER BY created_at DESC, id DESC')
    .all(jobId);
  return { ...job, tasks, updates, stages: STAGES };
}

function vehicleWithJobs(vehicle) {
  const jobs = db
    .prepare('SELECT * FROM jobs WHERE vehicle_id = ? ORDER BY created_at DESC')
    .all(vehicle.id)
    .map((j) => {
      const total = db.prepare('SELECT COUNT(*) AS n FROM job_tasks WHERE job_id = ?').get(j.id).n;
      const done = db
        .prepare('SELECT COUNT(*) AS n FROM job_tasks WHERE job_id = ? AND done = 1')
        .get(j.id).n;
      return { ...j, tasks_total: total, tasks_done: done };
    });
  return { ...vehicle, jobs };
}

function customerOverview(customerId) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) return null;
  const vehicles = db
    .prepare('SELECT * FROM vehicles WHERE customer_id = ? ORDER BY id')
    .all(customerId)
    .map(vehicleWithJobs);
  return { customer, vehicles, stages: STAGES };
}

function requireStaff(req, res, next) {
  if (req.header('x-staff-pin') !== STAFF_PIN) {
    return res.status(401).json({ error: 'Invalid staff PIN' });
  }
  next();
}

const touchJob = db.prepare("UPDATE jobs SET updated_at = datetime('now') WHERE id = ?");

// ---------- public (customer) routes ----------

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'PITLANE API' }));

app.get('/api/meta', (req, res) => res.json({ stages: STAGES, service_types: SERVICE_TYPES }));

// Login with phone number OR vehicle registration number — no password.
app.post('/api/login', (req, res) => {
  const identifier = String(req.body?.identifier || '').trim();
  if (!identifier) return res.status(400).json({ error: 'Enter your phone or vehicle number' });

  let customer = null;
  const phone = normalizePhone(identifier);
  if (phone.length === 10) {
    customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  }
  if (!customer) {
    const reg = normalizeReg(identifier);
    if (reg.length >= 5) {
      const vehicle = db
        .prepare("SELECT * FROM vehicles WHERE REPLACE(REPLACE(UPPER(reg_no), ' ', ''), '-', '') = ?")
        .get(reg);
      if (vehicle) {
        customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(vehicle.customer_id);
      }
    }
  }
  if (!customer) {
    return res
      .status(404)
      .json({ error: 'No record found. Check the number, or contact PITLANE to register.' });
  }
  res.json(customerOverview(customer.id));
});

app.get('/api/customers/:id/overview', (req, res) => {
  const overview = customerOverview(req.params.id);
  if (!overview) return res.status(404).json({ error: 'Customer not found' });
  res.json(overview);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobWithDetails(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ---------- staff routes ----------

app.post('/api/staff/login', (req, res) => {
  if (String(req.body?.pin || '') !== STAFF_PIN) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  res.json({ ok: true });
});

app.get('/api/staff/jobs', requireStaff, (req, res) => {
  const showAll = req.query.status === 'all';
  const rows = db
    .prepare(
      `SELECT j.*, v.reg_no, v.make, v.model, c.name AS customer_name, c.phone AS customer_phone
       FROM jobs j
       JOIN vehicles v ON v.id = j.vehicle_id
       JOIN customers c ON c.id = v.customer_id
       ${showAll ? '' : `WHERE j.stage_index < ${STAGES.length - 1}`}
       ORDER BY j.updated_at DESC`
    )
    .all();
  res.json({ jobs: rows, stages: STAGES });
});

app.get('/api/staff/customers', requireStaff, (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`;
  const customers = db
    .prepare(
      `SELECT c.*, COUNT(v.id) AS vehicle_count
       FROM customers c LEFT JOIN vehicles v ON v.customer_id = c.id
       WHERE c.name LIKE ? OR c.phone LIKE ?
       GROUP BY c.id ORDER BY c.name LIMIT 25`
    )
    .all(q, q);
  res.json({ customers });
});

app.get('/api/staff/customers/:id', requireStaff, (req, res) => {
  const overview = customerOverview(req.params.id);
  if (!overview) return res.status(404).json({ error: 'Customer not found' });
  res.json(overview);
});

app.post('/api/staff/customers', requireStaff, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const phone = normalizePhone(req.body?.phone || '');
  if (!name || phone.length !== 10) {
    return res.status(400).json({ error: 'Name and a 10-digit phone number are required' });
  }
  try {
    const info = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, phone);
    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(409).json({ error: 'A customer with this phone number already exists' });
  }
});

app.post('/api/staff/vehicles', requireStaff, (req, res) => {
  const { customer_id, make, model, year, color } = req.body || {};
  const reg = normalizeReg(req.body?.reg_no || '');
  if (!customer_id || reg.length < 5 || !make || !model) {
    return res.status(400).json({ error: 'Customer, registration number, make and model are required' });
  }
  try {
    const info = db
      .prepare('INSERT INTO vehicles (customer_id, reg_no, make, model, year, color) VALUES (?, ?, ?, ?, ?, ?)')
      .run(customer_id, reg, String(make).trim(), String(model).trim(), year || null, color || null);
    res.status(201).json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(409).json({ error: 'A vehicle with this registration number already exists' });
  }
});

app.post('/api/staff/jobs', requireStaff, (req, res) => {
  const { vehicle_id, service_type, description, estimated_delivery, cost_estimate, tasks } = req.body || {};
  if (!vehicle_id || !service_type) {
    return res.status(400).json({ error: 'Vehicle and service type are required' });
  }
  const info = db
    .prepare(
      'INSERT INTO jobs (vehicle_id, service_type, description, estimated_delivery, cost_estimate) VALUES (?, ?, ?, ?, ?)'
    )
    .run(vehicle_id, service_type, description || null, estimated_delivery || null, cost_estimate || null);
  const jobId = info.lastInsertRowid;
  const insertTask = db.prepare('INSERT INTO job_tasks (job_id, title, sort) VALUES (?, ?, ?)');
  (Array.isArray(tasks) ? tasks : [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .forEach((title, i) => insertTask.run(jobId, title, i));
  db.prepare('INSERT INTO job_updates (job_id, stage_index, message) VALUES (?, 0, ?)').run(
    jobId,
    'Vehicle received at PITLANE. Service initiated.'
  );
  res.status(201).json(jobWithDetails(jobId));
});

app.patch('/api/staff/jobs/:id', requireStaff, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const stageIndex = Number(req.body?.stage_index);
  if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= STAGES.length) {
    return res.status(400).json({ error: 'Invalid stage' });
  }
  const delivered = stageIndex === STAGES.length - 1;
  db.prepare(
    `UPDATE jobs SET stage_index = ?, updated_at = datetime('now'),
     completed_at = ${delivered ? "datetime('now')" : 'NULL'} WHERE id = ?`
  ).run(stageIndex, job.id);
  const message = String(req.body?.message || '').trim() || `Status updated: ${STAGES[stageIndex].label}`;
  db.prepare('INSERT INTO job_updates (job_id, stage_index, message) VALUES (?, ?, ?)').run(
    job.id,
    stageIndex,
    message
  );
  res.json(jobWithDetails(job.id));
});

app.post('/api/staff/jobs/:id/updates', requireStaff, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Message is required' });
  db.prepare('INSERT INTO job_updates (job_id, stage_index, message) VALUES (?, ?, ?)').run(
    job.id,
    job.stage_index,
    message
  );
  touchJob.run(job.id);
  res.status(201).json(jobWithDetails(job.id));
});

app.post('/api/staff/jobs/:id/tasks', requireStaff, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Task title is required' });
  const max = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM job_tasks WHERE job_id = ?').get(job.id).m;
  db.prepare('INSERT INTO job_tasks (job_id, title, sort) VALUES (?, ?, ?)').run(job.id, title, max + 1);
  touchJob.run(job.id);
  res.status(201).json(jobWithDetails(job.id));
});

app.patch('/api/staff/tasks/:id', requireStaff, (req, res) => {
  const task = db.prepare('SELECT * FROM job_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const done = req.body?.done ? 1 : 0;
  db.prepare(
    `UPDATE job_tasks SET done = ?, done_at = ${done ? "datetime('now')" : 'NULL'} WHERE id = ?`
  ).run(done, task.id);
  touchJob.run(task.job_id);
  res.json(jobWithDetails(task.job_id));
});

app.listen(PORT, () => {
  console.log(`PITLANE API running on http://localhost:${PORT}`);
});
