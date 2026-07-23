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
  try {
    if (!dateStr) return new Date().toISOString();
    
    // Paraguay time for 'today' (using UTC-3 offset matching the user's local timezone)
    let d = new Date();
    d = new Date(d.getTime() - (3 * 60 * 60 * 1000));
    
    let year = d.getUTCFullYear();
    let month = d.getUTCMonth() + 1;
    let day = d.getUTCDate();
    
    const strLower = dateStr.toLowerCase().trim();
    
    if (strLower.includes("hoy") || strLower.includes("today")) {
      // keep today
    } else if (strLower.includes("mañana") || strLower.includes("tomorrow")) {
      d.setUTCDate(d.getUTCDate() + 1);
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
    } else {
      if (strLower.includes('/')) {
        const parts = strLower.split(' ');
        const dayMonth = parts[parts.length - 1]; // "25/7"
        const dmParts = dayMonth.split('/');
        if (dmParts.length >= 2) {
          day = parseInt(dmParts[0]);
          month = parseInt(dmParts[1]);
        }
      } else {
        // Parse "Sat, Jul 25" or "Sáb, 25 jul"
        const months = {
          'jan': 1, 'ene': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'abr': 4,
          'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'ago': 8, 'sep': 9,
          'oct': 10, 'nov': 11, 'dec': 12, 'dic': 12
        };
        const parts = strLower.replace(/,/g, '').split(' ');
        let foundMonth = null;
        let foundDay = null;
        for (let p of parts) {
          if (!isNaN(parseInt(p))) {
            foundDay = parseInt(p);
          } else {
            for (const [mName, mNum] of Object.entries(months)) {
              if (p.includes(mName)) {
                foundMonth = mNum;
                break;
              }
            }
          }
        }
        if (foundMonth !== null && foundDay !== null) {
          month = foundMonth;
          day = foundDay;
        }
      }
    }
    
    let hour = 12;
    let min = 0;
    
    if (timeStr) {
      const isPm = timeStr.toLowerCase().includes('p');
      const timeParts = timeStr.replace(/[^0-9:]/g, '').split(':');
      if (timeParts.length >= 1) {
        let h = parseInt(timeParts[0]);
        if (!isNaN(h)) {
          hour = h;
          min = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
          if (isPm && hour < 12) hour += 12;
          if (!isPm && hour === 12) hour = 0;
        }
      }
    }
    
    const pad = (n) => n.toString().padStart(2, '0');
    // Offset -03:00 para coincidir con la hora local (Paraguay/Verano o GMT-3)
    const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00-03:00`;
    return new Date(isoString).toISOString();
  } catch (e) {
    console.error("Error parsing date:", e);
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

  const FALLBACK_LOGOS = {
    // Faltantes del Vercel
    "Rubio Ñu": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Escudo_Actual_del_Club_Rubio_%C3%91u_2026.png",
    "Deportivo Recoleta": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Recoleta_Football_Club_logo_Paraguay_official_crest.png",
    "Sportivo San Lorenzo": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Escudo_Sportivo_San_Lorenzo.png",
    "Sportivo Luqueño": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/EscudoLuque2022.png/250px-EscudoLuque2022.png",
    
    // Todos los demás de Primera División (por si acaso Google falla)
    "Cerro": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Escudo_Club_Cerro_Porte%C3%B1o_2023-Actual.svg/250px-Escudo_Club_Cerro_Porte%C3%B1o_2023-Actual.svg.png",
    "Cerro Porteño": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Escudo_Club_Cerro_Porte%C3%B1o_2023-Actual.svg/250px-Escudo_Club_Cerro_Porte%C3%B1o_2023-Actual.svg.png",
    "Olimpia": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Escudo_original_de_Olimpia.png/250px-Escudo_original_de_Olimpia.png",
    "Libertad": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Club_Libertad.png/250px-Club_Libertad.png",
    "Guaraní": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Guaran%C3%AD_Logo_2018.png/250px-Guaran%C3%AD_Logo_2018.png",
    "Nacional": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Club_Nacional_de_Paraguay.png/250px-Club_Nacional_de_Paraguay.png",
    "Nacional Asunción": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Club_Nacional_de_Paraguay.png/250px-Club_Nacional_de_Paraguay.png",
    "Sportivo Trinidense": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Club_Sportivo_Trinidense.svg/250px-Club_Sportivo_Trinidense.svg.png",
    "Trinidense": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Club_Sportivo_Trinidense.svg/250px-Club_Sportivo_Trinidense.svg.png",
    "Tacuary": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Tacuary_-_FBC_-_1923.png/250px-Tacuary_-_FBC_-_1923.png",
    "Sol de América": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Escudo_de_sol_de_am%C3%A9rica.png/250px-Escudo_de_sol_de_am%C3%A9rica.png",
    "Sportivo Ameliano": "https://upload.wikimedia.org/wikipedia/commons/c/c9/Club_Sportivo_Ameliano.png",
    "General Caballero JLM": "https://upload.wikimedia.org/wikipedia/commons/8/87/Club_General_Caballero_%28JLM%29.png",
    "General Caballero": "https://upload.wikimedia.org/wikipedia/commons/8/87/Club_General_Caballero_%28JLM%29.png",
    "2 de Mayo": "https://upload.wikimedia.org/wikipedia/commons/e/e1/Club_Sportivo_2_de_Mayo.png",
    "Guaireña": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Guaire%C3%B1a_FC.png",
    "Guaireña FC": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Guaire%C3%B1a_FC.png",
    "Resistencia": "https://upload.wikimedia.org/wikipedia/commons/d/df/Resistencia_Sport_Club.png",
    "Resistencia FC": "https://upload.wikimedia.org/wikipedia/commons/d/df/Resistencia_Sport_Club.png"
  };

  // Función para encontrar el logo ya sea por coincidencia exacta o parcial
  const getFallbackLogo = (teamName) => {
    if (!teamName) return "";
    if (FALLBACK_LOGOS[teamName]) return FALLBACK_LOGOS[teamName];
    // Buscar coincidencia parcial (ej. "Ameliano" -> "Sportivo Ameliano")
    for (const [key, logo] of Object.entries(FALLBACK_LOGOS)) {
      if (teamName.includes(key) || key.includes(teamName)) return logo;
    }
    return "";
  };

  const games = data.sports_results.games;
  return games.map((game, index) => {
    const homeTeam = game.teams[0];
    const awayTeam = game.teams[1];
    
    let status = 'upcoming';
    if (game.status === 'Finalizado' || game.status === 'FT') status = 'finished';
    if (game.status === 'En juego' || game.status === 'En vivo') status = 'live';

    const rawId = game.kgmid || game.tournament || 'liga';
    const safeId = rawId.replace(/\//g, '-').replace(/\s+/g, '-');

    return {
      id: `google_${index}_${safeId}`,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      tournament: game.tournament || data.sports_results.title || "Primera División",
      round: game.stage || "Fecha Regular",
      date: parseGoogleDate(game.date, game.time),
      status: status,
      scoreHome: homeTeam.score ? parseInt(homeTeam.score) : null,
      scoreAway: awayTeam.score ? parseInt(awayTeam.score) : null,
      homeLogo: logoMap[homeTeam.name] || getFallbackLogo(homeTeam.name) || homeTeam.thumbnail || "",
      awayLogo: logoMap[awayTeam.name] || getFallbackLogo(awayTeam.name) || awayTeam.thumbnail || "",
      stadium: game.lugar || "Estadio Local",
      lineupHome: [],
      lineupAway: [],
      events: []
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
