import { NextResponse } from 'next/server';

/**
 * Stripe Webhook Handler
 * Coming soon - Stripe integration is not yet available
 */
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Stripe integration coming soon' },
    { status: 503 }
  );
}
