import { NextResponse } from 'next/server';
import { getGoogleStandings } from '@/lib/serpapi-scraper';

export async function GET(request) {
  try {
    const stats = await getGoogleStandings();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
