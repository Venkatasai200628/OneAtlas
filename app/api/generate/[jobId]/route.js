import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/jobStore.js';

export async function GET(req, { params }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    prompt: job.prompt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    result: job.result,
    error: job.error,
    cost: job.cost,
    latency: job.latency,
    repairLog: job.repairLog,
    eventCount: job.events.length,
  });
}
