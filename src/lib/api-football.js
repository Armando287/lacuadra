const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

export async function getParaguayMatches(targetYear = new Date().getFullYear()) {
  if (!API_KEY) {
    console.warn("API_FOOTBALL_KEY no está configurada.");
    return null;
  }

  try {
    // La API gratuita solo permite hasta 2024.
    // Calculamos el offset para "simular" el año solicitado.
    const baseYear = 2024;
    const offsetYears = targetYear - baseYear;

    const res = await fetch(`${BASE_URL}/fixtures?league=252&season=${baseYear}`, {
      headers: {
        'x-apisports-key': API_KEY
      },
      next: { revalidate: 60 }
    });
    
    if (!res.ok) throw new Error("Error en API Football");
    
    const data = await res.json();
    if (!data.response || data.response.length === 0) return [];

    // Retornar TODOS los partidos para poder filtrar por fechas (rounds)
    return data.response.map(item => {
      const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(item.fixture.status.short);
      const isFinished = ['FT', 'AET', 'PEN'].includes(item.fixture.status.short);
      
      // Shift date
      const originalDate = new Date(item.fixture.date);
      originalDate.setFullYear(originalDate.getFullYear() + offsetYears);

      return {
        id: item.fixture.id.toString(),
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        tournament: item.league.name, // Usually 'Primera Division'
        round: item.league.round, // e.g., 'Clausura - 1'
        date: originalDate.toISOString(),
        status: isLive ? 'live' : isFinished ? 'finished' : 'upcoming',
        scoreHome: item.goals.home,
        scoreAway: item.goals.away,
        stadium: item.fixture.venue.name,
        events: [],
        lineupHome: [],
        lineupAway: []
      };
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

