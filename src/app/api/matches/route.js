import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { readDB } from '@/lib/db';
import { getParaguayMatches } from '@/lib/api-football';

export async function GET() {
  try {
    // 1. Intentar API-Football (Live)
    const apiMatches = await getParaguayMatches();
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

