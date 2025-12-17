import { NextResponse } from 'next/server';

/**
 * Stripe Connect OAuth Callback
 * Coming soon - Stripe integration is not yet available
 */
export async function GET(request: Request) {
  return NextResponse.json(
    { error: 'Stripe integration coming soon' },
    { status: 503 }
  );
}
