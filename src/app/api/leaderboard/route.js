import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getGoogleMatches } from '@/lib/serpapi-scraper';
import { calculateMatchPoints } from '@/lib/scoring';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  try {
    const db = readDB();
    const users = db.users;
    const votes = db.votes;
    
    // Fetch real matches to evaluate votes
    const matches = await getGoogleMatches();
    
    // Evaluate points for each vote
    const evaluatedVotes = votes.map(vote => {
      const match = matches.find(m => m.id === vote.matchId);
      if (!match) return { ...vote, points: 0, isExact: false, round: null };
      
      const { points, isExact } = calculateMatchPoints(vote, match);
      return { ...vote, points, isExact, round: match.round };
    });

    // Initialize user stats
    const userStats = {};
    users.forEach(u => {
      userStats[u.id] = {
        ...u,
        totalPoints: 0,
        exactHits: 0,
        roundWins: 0,
        totalPredictions: 0,
        roundScores: {} // { "Clausura - 1": 15, ... }
      };
    });

    // Sum points per user and per round
    evaluatedVotes.forEach(vote => {
      if (userStats[vote.userId]) {
        userStats[vote.userId].totalPredictions += 1;
        userStats[vote.userId].totalPoints += vote.points;
        if (vote.isExact) userStats[vote.userId].exactHits += 1;
        
        if (vote.round) {
          userStats[vote.userId].roundScores[vote.round] = (userStats[vote.userId].roundScores[vote.round] || 0) + vote.points;
        }
      }
    });

    // Calculate Round Winners and assign +5 bonus
    // Get unique rounds
    const rounds = [...new Set(evaluatedVotes.map(v => v.round).filter(r => r))];
    const roundWinners = {};

    rounds.forEach(round => {
      let maxPoints = -1;
      let winners = [];
      
      users.forEach(u => {
        const score = userStats[u.id].roundScores[round] || 0;
        if (score > maxPoints) {
          maxPoints = score;
          winners = [u.id];
        } else if (score === maxPoints && score > 0) {
          // Tie breakers for round: 1) Exact Hits in that round (we approximate with total exact hits for simplicity, or we can just share the bonus)
          // For simplicity, if there's a tie, all tied users get the bonus (or we can just skip tie breaker for now)
          winners.push(u.id);
        }
      });

      if (maxPoints > 0) {
        winners.forEach(winnerId => {
          userStats[winnerId].roundWins += 1;
          userStats[winnerId].totalPoints += 5; // BONUS!
        });
        roundWinners[round] = winners;
      }
    });

    // 1. General Leaderboard
    const generalLeaderboard = Object.values(userStats).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      if (b.roundWins !== a.roundWins) return b.roundWins - a.roundWins;
      return b.totalPredictions - a.totalPredictions;
    }).map(u => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      points: u.totalPoints,
      exactHits: u.exactHits,
      roundWins: u.roundWins,
      club: u.favoriteClub
    }));

    // 2. Fans Battle Leaderboard
    const fansBattle = {};
    Object.values(userStats).forEach(u => {
      const club = u.favoriteClub || 'Sin Club';
      if (!fansBattle[club]) fansBattle[club] = 0;
      fansBattle[club] += u.totalPoints;
    });

    const fansLeaderboard = Object.entries(fansBattle)
      .filter(([club, _]) => club !== 'Sin Club')
      .map(([club, points]) => ({ club, points }))
      .sort((a, b) => b.points - a.points);

    // 3. Round Leaderboards
    const roundLeaderboards = {};
    rounds.forEach(round => {
      roundLeaderboards[round] = Object.values(userStats)
        .map(u => ({
          id: u.id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          points: u.roundScores[round] || 0,
          isWinner: roundWinners[round]?.includes(u.id) || false
        }))
        .filter(u => u.points > 0 || u.isWinner)
        .sort((a, b) => b.points - a.points);
    });

    return NextResponse.json({ 
      general: generalLeaderboard, 
      fans: fansLeaderboard,
      rounds: roundLeaderboards 
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to generate leaderboard' }, { status: 500 });
  }
}
