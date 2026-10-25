import { NextRequest, NextResponse } from 'next/server';
import { getQuotes } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/quote?tickers=AAPL,7203.T
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tickers = (req.nextUrl.searchParams.get('tickers') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  if (tickers.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    const quotes = await cached(`quote:${tickers.join(',')}`, 30 * 1000, () =>
      getQuotes(tickers)
    );
    return NextResponse.json({ quotes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
