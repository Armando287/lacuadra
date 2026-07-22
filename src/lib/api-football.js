const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

export async function getParaguayMatches() {
  if (!API_KEY) {
    console.warn("API_FOOTBALL_KEY no está configurada.");
    return null;
  }

  try {
    // Liga Paraguaya ID: 252 (Primera Division)
    // Traemos los partidos de la temporada actual (ej: 2024 o 2025)
    const year = new Date().getFullYear();
    const res = await fetch(`${BASE_URL}/fixtures?league=252&season=${year}&next=10`, {
      headers: {
        'x-apisports-key': API_KEY
      },
      next: { revalidate: 60 } // Cachear por 60 segundos
    });
    
    if (!res.ok) throw new Error("Error en API Football");
    
    const data = await res.json();
    if (!data.response) return [];

    return data.response.map(item => {
      const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(item.fixture.status.short);
      const isFinished = ['FT', 'AET', 'PEN'].includes(item.fixture.status.short);
      
      return {
        id: item.fixture.id.toString(),
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        tournament: item.league.name,
        date: item.fixture.date,
        status: isLive ? 'live' : isFinished ? 'finished' : 'upcoming',
        scoreHome: item.goals.home,
        scoreAway: item.goals.away,
        stadium: item.fixture.venue.name,
        events: [], // En una versión más avanzada se hace un fetch a /fixtures/events
        lineupHome: [],
        lineupAway: []
      };
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

