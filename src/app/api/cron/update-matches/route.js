import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPromiedosMatches } from '@/lib/promiedos-scraper';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    // Basic protection to prevent abuse (cron-job.org will need to pass ?key=lacuadra-bot)
    if (key !== (process.env.CRON_SECRET || 'lacuadra-bot')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Promiedos active matches (live, finished today, upcoming today)
    const activeMatches = await getPromiedosMatches();
    
    if (!activeMatches || activeMatches.length === 0) {
      return NextResponse.json({ success: true, message: 'No active matches found in Promiedos.' });
    }

    let updatedCount = 0;
    const updatedMatches = [];

    // Loop through each active match and update it in our DB if it exists
    for (const match of activeMatches) {
      const { data, error } = await supabase
        .from('matches')
        .update({
          status: match.status,
          score_home: match.scoreHome !== undefined ? match.scoreHome : null,
          score_away: match.scoreAway !== undefined ? match.scoreAway : null,
          match_date: match.date // Useful in case of postponements
        })
        .eq('id', match.id)
        .select();
        
      if (!error && data && data.length > 0) {
        updatedCount++;
        updatedMatches.push(`${data[0].home_team} vs ${data[0].away_team} [${match.status}]`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync complete. Fetched ${activeMatches.length} from Promiedos. Updated ${updatedCount} matches in DB.`,
      updated_matches: updatedMatches
    });
    
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
