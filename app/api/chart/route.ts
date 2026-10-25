import { NextRequest, NextResponse } from 'next/server';
import { getChart, chartToCandles, computeIndicators } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/chart?ticker=600519.SS&range=6mo&interval=1d
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker');
  const range = req.nextUrl.searchParams.get('range') || '6mo';
  const interval = req.nextUrl.searchParams.get('interval') || '1d';

  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 });
  }

  try {
    const data = await cached(`chart:${ticker}:${range}:${interval}`, 60 * 1000, async () => {
      const result = await getChart(ticker, range, interval);
      if (!result) return null;
      const candles = chartToCandles(result);
      const meta = result.meta as Record<string, any>;
      return {
        ticker,
        currency: meta.currency || 'USD',
        name: meta.longName || meta.shortName || ticker,
        candles,
        indicators: computeIndicators(candles),
      };
    });

    if (!data) {
      return NextResponse.json({ error: `No data for ${ticker}` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
