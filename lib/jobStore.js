const globalForJobs = globalThis;
if (!globalForJobs.__oneatlasJobs) {
  globalForJobs.__oneatlasJobs = new Map();
}
const jobs = globalForJobs.__oneatlasJobs;

export function createJob(jobId, prompt) {
  const job = {
    jobId,
    prompt,
    status: 'pending',
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
    error: null,
    cost: {
      stages: {},
      totalUsd: 0,
    },
    latency: {},
    repairLog: [],
    subscribers: new Set(),
  };
  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function addEvent(jobId, type, data) {
  const job = jobs.get(jobId);
  if (!job) return;

  const event = {
    type,
    data,
    timestamp: new Date().toISOString(),
    seq: job.events.length,
  };

  job.events.push(event);
  job.updatedAt = new Date().toISOString();

  for (const subscriber of job.subscribers) {
    try {
      subscriber(event);
    } catch (e) {
      job.subscribers.delete(subscriber);
    }
  }

  return event;
}

export function subscribe(jobId, callback) {
  const job = jobs.get(jobId);
  if (!job) return () => {};
  job.subscribers.add(callback);
  return () => job.subscribers.delete(callback);
}

export function updateJobStatus(jobId, status, result = null, error = null) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = status;
  job.updatedAt = new Date().toISOString();
  if (result !== null) job.result = result;
  if (error !== null) job.error = error;
}

export function updateJobCost(jobId, stage, cost) {
  const job = jobs.get(jobId);
  if (!job || !cost) return;
  job.cost.stages[stage] = cost;
  job.cost.totalUsd = Object.values(job.cost.stages).reduce((sum, c) => sum + (c?.usd || 0), 0);
}

export function updateJobLatency(jobId, stage, ms) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.latency[stage] = ms;
}

export function addRepairLog(jobId, entries) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.repairLog.push(...entries);
}

export function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cleanupJobs() {
  if (jobs.size > 100) {
    const oldest = [...jobs.keys()].slice(0, jobs.size - 100);
    for (const id of oldest) jobs.delete(id);
  }
}
