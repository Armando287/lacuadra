import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getGoogleMatches } from '@/lib/serpapi-scraper';

// GET all matches for admin table
export async function GET() {
  try {
    const { data: matches, error } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, round, tournament, match } = body;

    if (action === 'fetch_google') {
      const apiMatches = await getGoogleMatches();
      
      let matchesToInsert = apiMatches;

      if (matchesToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'No se encontraron partidos en Google.' });
      }

      const dbPayload = matchesToInsert.map(m => ({
        id: m.id,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        // Overrides the scraped values with the ones typed by the admin
        tournament: tournament || m.tournament,
        round: round || m.round,
        match_date: m.date,
        status: m.status,
        score_home: m.scoreHome,
        score_away: m.scoreAway,
        home_logo: m.homeLogo,
        away_logo: m.awayLogo,
        stadium: m.stadium,
        events: m.events,
        lineup_home: m.lineupHome,
        lineup_away: m.lineupAway
      }));

      const { data, error } = await supabase.from('matches').upsert(dbPayload).select();
      if (error) throw error;
      return NextResponse.json({ success: true, count: data.length, matches: data });
    }

    if (action === 'create_manual' || action === 'update_manual') {
      if (!match) return NextResponse.json({ success: false, error: 'Datos del partido requeridos.' });
      
      // Ensure we have an ID for creation
      const matchId = match.id || `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const dbPayload = {
        id: matchId,
        home_team: match.home_team,
        away_team: match.away_team,
        tournament: match.tournament || 'Primera División de Paraguay',
        round: match.round || 'Fecha Regular',
        match_date: match.match_date || new Date().toISOString(),
        status: match.status || 'upcoming',
        score_home: match.score_home !== '' ? parseInt(match.score_home) : null,
        score_away: match.score_away !== '' ? parseInt(match.score_away) : null,
        home_logo: match.home_logo || '',
        away_logo: match.away_logo || '',
        stadium: match.stadium || ''
      };

      const { data, error } = await supabase.from('matches').upsert([dbPayload]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, match: data[0] });
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE a match
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Match ID required' }, { status: 400 });

    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
