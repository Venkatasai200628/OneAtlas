import { NextResponse } from 'next/server';
import { getAllIntegrations } from '../../../lib/integrations.js';

export async function GET() {
  const integrations = getAllIntegrations();
  return NextResponse.json({
    integrations,
    total: integrations.length,
    implemented: integrations.filter(i => i.implemented).length,
  });
}
