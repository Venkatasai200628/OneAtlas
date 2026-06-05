import { NextResponse } from 'next/server';
import { getJob, addEvent, addRepairLog } from '../../../../../lib/jobStore.js';
import { validateDataSchema, validateAppSpec } from '../../../../../lib/validation.js';
import { runRepairEngine } from '../../../../../lib/repair.js';

export async function POST(req, { params }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (!job.result) {
    return NextResponse.json({ error: 'Job has no result to repair' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { stage, errorHint = '' } = body;

    if (!stage || !['schema', 'appspec'].includes(stage)) {
      return NextResponse.json({ error: 'stage must be "schema" or "appspec"' }, { status: 400 });
    }

    const { dataSchema, appSpec } = job.result;
    let validation, repairResult;

    if (stage === 'schema') {
      validation = validateDataSchema(dataSchema);
      repairResult = await runRepairEngine('schema', JSON.stringify(dataSchema), dataSchema, validation, null, job.result.intent, errorHint);
      if (repairResult.output) {
        job.result.dataSchema = repairResult.output;
      }
    } else {
      validation = validateAppSpec(appSpec, dataSchema);
      repairResult = await runRepairEngine('appspec', JSON.stringify(appSpec), appSpec, validation, dataSchema, job.result.intent, errorHint);
      if (repairResult.output) {
        job.result.appSpec = repairResult.output;
      }
    }

    addRepairLog(jobId, repairResult.repairLog);
    addEvent(jobId, 'manual_repair_complete', {
      stage,
      repairLog: repairResult.repairLog,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      stage,
      repairLog: repairResult.repairLog,
      result: stage === 'schema' ? job.result.dataSchema : job.result.appSpec,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
