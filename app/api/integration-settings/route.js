import { NextResponse } from 'next/server';
import { bulkSetIntegrationKeys, getAllIntegrationCredentials } from '../../../lib/integrationKeyStore.js';

export async function GET() {
  return NextResponse.json({ integrations: getAllIntegrationCredentials() });
}

export async function POST(req) {
  try {
    const { keys } = await req.json();
    if (!keys || typeof keys !== 'object') {
      return NextResponse.json({ error: 'keys object required' }, { status: 400 });
    }
    bulkSetIntegrationKeys(keys);
    return NextResponse.json({ success: true, integrations: getAllIntegrationCredentials() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
