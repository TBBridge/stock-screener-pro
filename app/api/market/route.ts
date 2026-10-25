import { NextRequest, NextResponse } from 'next/server';
import { getQuotes } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/market — 全球主要指数实时行情
export const dynamic = 'force-dynamic';

const INDICES: Array<{ ticker: string; label: string; market: string }> = [
  { ticker: '000001.SS', label: '上证指数', market: 'CN' },
  { ticker: '399001.SZ', label: '深证成指', market: 'CN' },
  { ticker: '399006.SZ', label: '创业板指', market: 'CN' },
  { ticker: '^HSI', label: '恒生指数', market: 'HK' },
  { ticker: '^N225', label: '日经225', market: 'JP' },
  { ticker: '^GSPC', label: '标普500', market: 'US' },
  { ticker: '^IXIC', label: '纳斯达克', market: 'US' },
  { ticker: '^DJI', label: '道琼斯', market: 'US' },
];

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get('tickers');
  const list: Array<{ ticker: string; label?: string; market?: string }> = tickersParam
    ? tickersParam.split(',').map((s) => s.trim()).filter(Boolean).map((t) => ({ ticker: t }))
    : INDICES;

  const tickers = list.map((i) => i.ticker);

  try {
    const data = await cached(`market:${tickers.join(',')}`, 30 * 1000, async () => {
      const quotes = await getQuotes(tickers);
      return quotes.map((q) => {
        const meta = list.find((i) => i.ticker === q.ticker);
        return {
          ...q,
          label: meta?.label || q.name,
          market: meta?.market || '',
        };
      });
    });
    return NextResponse.json({ indices: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
