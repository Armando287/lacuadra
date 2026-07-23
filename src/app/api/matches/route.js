import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getGoogleMatches } from '@/lib/serpapi-scraper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const { data: dbMatches, error } = await supabase.from('matches').select('*');
    if (error) throw error;
    
    if (dbMatches) {
      // Map database snake_case to frontend camelCase
      const matches = dbMatches.map(m => ({
        id: m.id,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        tournament: m.tournament,
        round: m.round,
        date: m.match_date,
        status: m.status,
        scoreHome: m.score_home,
        scoreAway: m.score_away,
        homeLogo: m.home_logo,
        awayLogo: m.away_logo,
        stadium: m.stadium,
        events: m.events || [],
        lineupHome: m.lineup_home || [],
        lineupAway: m.lineup_away || []
      }));
      
      // Optionally filter by year if needed
      const filteredMatches = matches.filter(m => new Date(m.date).getFullYear() === targetYear);
      return NextResponse.json({ matches: filteredMatches });
    }
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({ matches: [] });
}

