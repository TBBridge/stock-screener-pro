import { NextRequest, NextResponse } from 'next/server';
import { getDetail } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/details?ticker=AAPL
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker');
  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 });
  }

  try {
    const detail = await cached(`detail:${ticker}`, 60 * 1000, () => getDetail(ticker));
    if (!detail) {
      return NextResponse.json({ error: `No data for ${ticker}` }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
