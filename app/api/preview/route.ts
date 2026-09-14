import { NextRequest, NextResponse } from 'next/server';
import { getLinkPreview, normalizePreviewUrl } from '@/app/lib/link-preview';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url') || '';
  if (!normalizePreviewUrl(raw)) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const preview = await getLinkPreview(raw);
  return NextResponse.json(preview, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
