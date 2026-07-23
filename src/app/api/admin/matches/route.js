import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getGoogleMatches } from '@/lib/serpapi-scraper';

export async function POST(request) {
  try {
    const { action, round, tournament } = await request.json();

    if (action === 'fetch_google') {
      const apiMatches = await getGoogleMatches();
      
      // Filter matches by the requested round/tournament if they are provided
      let matchesToInsert = apiMatches;
      
      if (round) {
        matchesToInsert = matchesToInsert.filter(m => m.round === round || m.round.includes(round));
      }
      
      if (tournament) {
        matchesToInsert = matchesToInsert.filter(m => m.tournament === tournament || m.tournament.includes(tournament));
      }

      if (matchesToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'No se encontraron partidos para esa fecha/torneo en Google.' });
      }

      // Convert to snake_case for Supabase
      const dbPayload = matchesToInsert.map(m => ({
        id: m.id,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        tournament: m.tournament,
        round: m.round,
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

      // Upsert into Supabase (insert or update if ID exists)
      const { data, error } = await supabase
        .from('matches')
        .upsert(dbPayload)
        .select();

      if (error) throw error;

      return NextResponse.json({ success: true, count: data.length, matches: data });
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
