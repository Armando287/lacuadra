// SerpApi Google Sports Scraper
// Usa https://serpapi.com/google-sports-api
export async function fetchFromSerpApi(query) {
  const apiKey = "2074552c1b292eef3a49f6dc529eed4fef75a019eb52f3c63c933d7291b986ed";
  
  if (!apiKey) {
    console.warn("SERPAPI_KEY no configurado. Usando datos de respaldo.");
    return null;
  }

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&hl=es&gl=py&api_key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SerpApi error: ${response.statusText}`);
  }
  return response.json();
}

function parseGoogleDate(dateStr, timeStr) {
  // Ej: dateStr = "Sáb, 25/7", timeStr = "4:00 p. m."
  try {
    if (!dateStr) return new Date().toISOString();
    const parts = dateStr.split(' ');
    const dayMonth = parts[parts.length - 1]; // "25/7"
    const [day, month] = dayMonth.split('/');
    const year = new Date().getFullYear();
    let d = new Date(year, parseInt(month) - 1, parseInt(day));
    
    // Parse time if present (basic)
    if (timeStr) {
      const isPm = timeStr.includes('p');
      const timeParts = timeStr.replace(/[^0-9:]/g, '').split(':');
      let hour = parseInt(timeParts[0]);
      const min = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
      d.setHours(hour, min, 0, 0);
    }
    return d.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

export async function getGoogleMatches() {
  const data = await fetchFromSerpApi("Primera División de Paraguay partidos");
  
  if (!data || !data.sports_results || !data.sports_results.games) {
    return getFallbackMatches();
  }

  // Extraemos logos de la tabla de posiciones que viene incluida a veces, o de otra query
  const logoMap = {};
  if (data.sports_results.league && data.sports_results.league.standings) {
    data.sports_results.league.standings.forEach(s => {
      logoMap[s.team.name] = s.team.thumbnail;
    });
  }
  if (data.sports_results.other_leagues) {
    data.sports_results.other_leagues.forEach(league => {
      league.standings.forEach(s => {
        logoMap[s.team.name] = s.team.thumbnail;
      });
    });
  }

  const games = data.sports_results.games;
  return games.map((game, index) => {
    const homeTeam = game.teams[0];
    const awayTeam = game.teams[1];
    
    let status = 'upcoming';
    if (game.status === 'Finalizado' || game.status === 'FT') status = 'finished';
    if (game.status === 'En juego' || game.status === 'En vivo') status = 'live';

    return {
      id: `google_${index}_${game.kgmid || game.tournament}`,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      tournament: game.tournament || data.sports_results.title || "Primera División",
      round: game.stage || "Fecha Regular",
      date: parseGoogleDate(game.date, game.time),
      status: status,
      scoreHome: homeTeam.score ? parseInt(homeTeam.score) : null,
      scoreAway: awayTeam.score ? parseInt(awayTeam.score) : null,
      homeLogo: logoMap[homeTeam.name] || homeTeam.thumbnail || "",
      awayLogo: logoMap[awayTeam.name] || awayTeam.thumbnail || "",
      stadium: game.lugar || "Estadio Local"
    };
  });
}

export async function getGoogleStandings() {
  const data = await fetchFromSerpApi("Primera División de Paraguay posiciones");
  
  if (!data || !data.sports_results || !data.sports_results.league) {
    return getFallbackStandings();
  }

  // Tratamos de obtener standings del Clausura si existe en other_leagues, o usamos league
  let standingsArray = [];
  if (data.sports_results.other_leagues && data.sports_results.other_leagues.length > 0) {
    const clausura = data.sports_results.other_leagues.find(l => l.name === "Clausura");
    if (clausura) standingsArray = clausura.standings;
  }
  if (standingsArray.length === 0 && data.sports_results.league.standings) {
    standingsArray = data.sports_results.league.standings;
  }

  const standings = standingsArray.map((team, idx) => ({
    equipo: team.team.name,
    logo: team.team.thumbnail,
    puntos: parseInt(team.pts || 0),
    partidos: parseInt(team.pj || team.played || 0),
    victorias: parseInt(team.g || team.won || 0),
    empates: parseInt(team.e || team.drawn || 0),
    derrotas: parseInt(team.p || team.lost || 0),
    golesFavor: parseInt(team.gf || team.goals_for || 0),
    golesContra: parseInt(team.gc || team.goals_against || 0),
    diferenciaGoles: parseInt(team.dg || team.goal_difference || 0),
    promedio: parseInt(team.pts) / parseInt(team.pj || 1) || 0
  }));

  const { goleadores, asistencias } = getFallbackStats();
  return { promedios: standings, goleadores, asistencias };
}

// ==========================================
// FALLBACKS (Mocks de Google Sports)
// ==========================================

function getFallbackMatches() {
  return [
    {
      id: "google_1", homeTeam: "Cerro Porteño", awayTeam: "Olimpia",
      tournament: "Primera División", round: "Fecha 1",
      date: new Date().toISOString(), status: "live", scoreHome: 1, scoreAway: 1,
      homeLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/u-Wn8AibH03R8Tf1Z3f9VQ_48x48.png", 
      awayLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/Hw3hF59UvB_O4v6E1V1j4w_48x48.png",
      stadium: "La Nueva Olla"
    },
    {
      id: "google_2", homeTeam: "Libertad", awayTeam: "Guaraní",
      tournament: "Primera División", round: "Fecha 1",
      date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), status: "upcoming", scoreHome: null, scoreAway: null,
      homeLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/6R9GkHk8Y4H1Q8z2B7e6Vw_48x48.png", 
      awayLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/7L8FjGj7X3G0P7y1A6d5Uw_48x48.png",
      stadium: "Tigo La Huerta"
    },
    {
      id: "google_3", homeTeam: "Nacional Asunción", awayTeam: "Cerro Porteño",
      tournament: "Primera División", round: "Fecha 2",
      date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), status: "upcoming", scoreHome: null, scoreAway: null,
      homeLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/4T7DjFj5V1E8O5x0Z4c3Sw_48x48.png", 
      awayLogo: "https://ssl.gstatic.com/onebox/media/sports/logos/u-Wn8AibH03R8Tf1Z3f9VQ_48x48.png",
      stadium: "Arsenio Erico"
    }
  ];
}

function getFallbackStandings() {
  const standings = [
    { equipo: "Olimpia", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/Hw3hF59UvB_O4v6E1V1j4w_48x48.png", puntos: 49, partidos: 22, promedio: 2.22 },
    { equipo: "Nacional Asunción", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/4T7DjFj5V1E8O5x0Z4c3Sw_48x48.png", puntos: 39, partidos: 22, promedio: 1.77 },
    { equipo: "Cerro Porteño", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/u-Wn8AibH03R8Tf1Z3f9VQ_48x48.png", puntos: 38, partidos: 22, promedio: 1.72 },
    { equipo: "Sportivo Ameliano", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/8M9HkIk9Z5I2R9a3C8f7Ww_48x48.png", puntos: 33, partidos: 22, promedio: 1.50 },
    { equipo: "Trinidense", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/9N0IlJl0A6J3S0b4D9g8Xx_48x48.png", puntos: 32, partidos: 22, promedio: 1.45 },
    { equipo: "Libertad", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/6R9GkHk8Y4H1Q8z2B7e6Vw_48x48.png", puntos: 31, partidos: 22, promedio: 1.40 },
    { equipo: "Guaraní", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/7L8FjGj7X3G0P7y1A6d5Uw_48x48.png", puntos: 29, partidos: 22, promedio: 1.31 },
    { equipo: "Sportivo Luqueño", logo: "https://ssl.gstatic.com/onebox/media/sports/logos/2R5BhDh3T9C6M3v8X2a1Qw_48x48.png", puntos: 20, partidos: 22, promedio: 0.90 }
  ];
  
  const { goleadores, asistencias } = getFallbackStats();
  return { promedios: standings, goleadores, asistencias };
}

function getFallbackStats() {
  return {
    goleadores: [
      { jugador: "Óscar Cardozo", equipo: "Libertad", goles: 12, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/6R9GkHk8Y4H1Q8z2B7e6Vw_48x48.png" },
      { jugador: "Cecilio Domínguez", equipo: "Cerro Porteño", goles: 10, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/u-Wn8AibH03R8Tf1Z3f9VQ_48x48.png" },
      { jugador: "Derlis González", equipo: "Olimpia", goles: 9, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/Hw3hF59UvB_O4v6E1V1j4w_48x48.png" }
    ],
    asistencias: [
      { jugador: "Héctor Villalba", equipo: "Libertad", asistencias: 8, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/6R9GkHk8Y4H1Q8z2B7e6Vw_48x48.png" },
      { jugador: "Federico Carrizo", equipo: "Cerro Porteño", asistencias: 7, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/u-Wn8AibH03R8Tf1Z3f9VQ_48x48.png" },
      { jugador: "Hugo Fernández", equipo: "Olimpia", asistencias: 6, logo: "https://ssl.gstatic.com/onebox/media/sports/logos/Hw3hF59UvB_O4v6E1V1j4w_48x48.png" }
    ]
  };
}
