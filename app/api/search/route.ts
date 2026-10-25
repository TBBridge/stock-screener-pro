import { NextRequest, NextResponse } from 'next/server';
import { searchSymbol } from '@/app/lib/yahooServer';
import { cached } from '@/app/lib/apiCache';

// GET /api/search?q=苹果
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await cached(`search:${q}`, 10 * 60 * 1000, () => searchSymbol(q.trim()));
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
