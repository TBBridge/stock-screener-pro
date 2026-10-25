import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/news?ticker=AAPL （不传 ticker 返回市场要闻）
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') || undefined;
  const count = Math.min(Number(req.nextUrl.searchParams.get('count')) || 15, 30);

  try {
    const news = await cached(`news:${ticker || 'market'}:${count}`, 5 * 60 * 1000, () =>
      getNews(ticker, count)
    );
    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
