import Constants from 'expo-constants';

export type Stage = { key: string; label: string };

export type Customer = { id: number; name: string; phone: string };

export type JobSummary = {
  id: number;
  vehicle_id: number;
  service_type: string;
  description: string | null;
  stage_index: number;
  estimated_delivery: string | null;
  cost_estimate: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  tasks_total?: number;
  tasks_done?: number;
};

export type Vehicle = {
  id: number;
  customer_id: number;
  reg_no: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  jobs: JobSummary[];
};

export type JobTask = { id: number; job_id: number; title: string; done: number; done_at: string | null };

export type JobUpdate = {
  id: number;
  job_id: number;
  stage_index: number;
  message: string;
  created_by: string;
  created_at: string;
};

export type JobDetail = JobSummary & {
  reg_no: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  tasks: JobTask[];
  updates: JobUpdate[];
  stages: Stage[];
};

export type Overview = { customer: Customer; vehicles: Vehicle[]; stages: Stage[] };

export type StaffJobRow = JobSummary & {
  reg_no: string;
  make: string;
  model: string;
  customer_name: string;
  customer_phone: string;
};

// On a physical device the API runs on the dev machine, not the phone.
// Expo exposes the dev machine's address via hostUri, so derive it from there;
// EXPO_PUBLIC_API_URL overrides for production builds.
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:4000`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new ApiError('Cannot reach PITLANE. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || 'Something went wrong', res.status);
  return body as T;
}

export const api = {
  login: (identifier: string) =>
    request<Overview>('/api/login', { method: 'POST', body: JSON.stringify({ identifier }) }),
  overview: (customerId: number) => request<Overview>(`/api/customers/${customerId}/overview`),
  job: (id: number | string) => request<JobDetail>(`/api/jobs/${id}`),
  meta: () => request<{ stages: Stage[]; service_types: string[] }>('/api/meta'),

  staff: {
    login: (pin: string) =>
      request<{ ok: true }>('/api/staff/login', { method: 'POST', body: JSON.stringify({ pin }) }),
    jobs: (pin: string, all = false) =>
      request<{ jobs: StaffJobRow[]; stages: Stage[] }>(`/api/staff/jobs${all ? '?status=all' : ''}`, {
        headers: { 'x-staff-pin': pin },
      }),
    customers: (pin: string, q: string) =>
      request<{ customers: (Customer & { vehicle_count: number })[] }>(
        `/api/staff/customers?q=${encodeURIComponent(q)}`,
        { headers: { 'x-staff-pin': pin } }
      ),
    customerOverview: (pin: string, id: number) =>
      request<Overview>(`/api/staff/customers/${id}`, { headers: { 'x-staff-pin': pin } }),
    createCustomer: (pin: string, data: { name: string; phone: string }) =>
      request<Customer>('/api/staff/customers', {
        method: 'POST',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify(data),
      }),
    createVehicle: (
      pin: string,
      data: { customer_id: number; reg_no: string; make: string; model: string; year?: string; color?: string }
    ) =>
      request<Vehicle>('/api/staff/vehicles', {
        method: 'POST',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify(data),
      }),
    createJob: (
      pin: string,
      data: {
        vehicle_id: number;
        service_type: string;
        description?: string;
        estimated_delivery?: string;
        cost_estimate?: number;
        tasks?: string[];
      }
    ) =>
      request<JobDetail>('/api/staff/jobs', {
        method: 'POST',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify(data),
      }),
    setStage: (pin: string, jobId: number, stage_index: number, message?: string) =>
      request<JobDetail>(`/api/staff/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify({ stage_index, message }),
      }),
    postUpdate: (pin: string, jobId: number, message: string) =>
      request<JobDetail>(`/api/staff/jobs/${jobId}/updates`, {
        method: 'POST',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify({ message }),
      }),
    addTask: (pin: string, jobId: number, title: string) =>
      request<JobDetail>(`/api/staff/jobs/${jobId}/tasks`, {
        method: 'POST',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify({ title }),
      }),
    setTaskDone: (pin: string, taskId: number, done: boolean) =>
      request<JobDetail>(`/api/staff/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'x-staff-pin': pin },
        body: JSON.stringify({ done }),
      }),
  },
};

// SQLite stores UTC timestamps without a timezone marker — append Z when parsing.
export function parseDbDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return new Date(value.replace(' ', 'T') + 'Z');
  return new Date(value);
}

export function formatDateTime(value: string): string {
  const d = parseDbDate(value);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function formatDate(value: string): string {
  const d = parseDbDate(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMoney(value: number): string {
  return '₹' + value.toLocaleString('en-IN');
}

export function formatReg(reg: string): string {
  // KL18AB1234 -> KL 18 AB 1234
  const m = reg.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : reg;
}
