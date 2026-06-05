import { getJob, subscribe } from '../../../../../lib/jobStore.js';

export async function GET(req, { params }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return new Response('Job not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function sendEvent(event) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      for (const event of job.events) {
        sendEvent(event);
      }

      if (job.status === 'complete' || job.status === 'failed') {
        controller.close();
        return;
      }

      const unsubscribe = subscribe(jobId, (event) => {
        sendEvent(event);
        if (event.type === 'generation_complete' || event.type === 'generation_failed') {
          unsubscribe();
          controller.close();
        }
      });

      req.signal?.addEventListener('abort', () => {
        unsubscribe();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
