// Stripe integration coming soon - all Stripe imports removed
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Stripe integration coming soon' },
    { status: 503 }
  );
}
