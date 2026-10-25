import { NextRequest, NextResponse } from 'next/server';
import { runRealScreener, RealCriteria } from '@/app/lib/realScreener';
import { cached } from '@/app/lib/apiCache';
import { ScreenerEngine } from '@/app/types/stock';

export const dynamic = 'force-dynamic';

const ENGINES: ScreenerEngine[] = ['value', 'pullback', 'alpha', 'custom'];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const engineParam = sp.get('engine') as ScreenerEngine | null;
  const engine: ScreenerEngine = engineParam && ENGINES.includes(engineParam) ? engineParam : 'value';

  let criteria: RealCriteria = {};
  if (engine === 'custom') {
    try {
      criteria = JSON.parse(sp.get('criteria') || '{}');
    } catch {
      criteria = {};
    }
  }

  const key = `screener:${engine}:${JSON.stringify(criteria)}`;

  try {
    const result = await cached(key, 5 * 60 * 1000, () => runRealScreener(engine, criteria));
    return NextResponse.json({
      engine,
      criteria,
      stocks: result.stocks,
      totalCount: result.stocks.length,
      universeSize: result.universeSize,
      fetched: result.fetched,
      sources: result.sources,
      executedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'screener failed', stocks: [], totalCount: 0 },
      { status: 500 }
    );
  }
}
