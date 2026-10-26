import { NextRequest, NextResponse } from 'next/server';
import { runRealScreener } from '@/app/lib/realScreener';
import { cached } from '@/app/lib/apiCache';
import { ScreenerEngine } from '@/app/types/stock';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ENGINES: ScreenerEngine[] = ['value', 'pullback', 'alpha', 'custom'];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const engineParam = sp.get('engine') as ScreenerEngine | null;
  const engine: ScreenerEngine = engineParam && ENGINES.includes(engineParam) ? engineParam : 'value';
  const klineBudget = Math.min(300, Math.max(30, parseInt(sp.get('budget') || '150', 10) || 150));

  let criteria: Record<string, unknown> = {};
  if (engine === 'custom') {
    try {
      criteria = JSON.parse(sp.get('criteria') || '{}');
    } catch {
      criteria = {};
    }
  }

  const key = `screener2:${engine}:${JSON.stringify(criteria)}:${klineBudget}`;

  try {
    const result = await cached(key, 10 * 60 * 1000, () =>
      runRealScreener(engine, criteria as any, klineBudget)
    );
    return NextResponse.json({
      engine,
      criteria,
      stocks: result.stocks,
      totalCount: result.stocks.length,
      stats: result.stats,
      executedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'screener failed', stocks: [], totalCount: 0 },
      { status: 500 }
    );
  }
}
