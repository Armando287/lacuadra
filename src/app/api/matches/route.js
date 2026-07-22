import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getGoogleMatches } from '@/lib/serpapi-scraper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // 1. Obtener datos desde Google Sports (SerpApi)
    const apiMatches = await getGoogleMatches();
    if (apiMatches && apiMatches.length > 0) {
      return NextResponse.json({ matches: apiMatches });
    }

    // 2. Intentar Supabase (Cached/Saved)
    const { data: matches, error } = await supabase.from('matches').select('*');
    if (!error && matches && matches.length > 0) {
      return NextResponse.json({ matches });
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback seguro: devolver array vacío para no mostrar partidos inventados
  return NextResponse.json({ matches: [] });
}

