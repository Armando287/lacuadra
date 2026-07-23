import * as cheerio from 'cheerio';

const PROMIEDOS_URL = 'https://www.promiedos.com.ar/league/copa-de-primera/gcb';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

function parsePromiedosDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  try {
    const [datePart, timePart] = dateStr.split(' ');
    if (!datePart || !timePart) return new Date().toISOString();
    
    const [day, month, year] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    
    // Timezone Paraguay (UTC-3)
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:00-03:00`;
    return new Date(isoString).toISOString();
  } catch (e) {
    console.error("Error parsing date:", e);
    return new Date().toISOString();
  }
}

function mapStatus(statusName) {
  if (!statusName) return 'upcoming';
  const s = statusName.toLowerCase();
  if (s === 'finalizado' || s === 'fin' || s === 'final') return 'finished';
  if (s === 'en juego' || s === 'pt' || s === 'st' || s === 'et' || s === 'entretiempo') return 'live';
  if (s === 'susp.' || s === 'susp' || s === 'suspendido') return 'suspended';
  if (s === 'post.' || s === 'postergado') return 'postponed';
  return 'upcoming';
}

function parseGames(games, roundName) {
  if (!games || !Array.isArray(games)) return [];
  
  return games.map(game => {
    const homeTeam = game.teams[0];
    const awayTeam = game.teams[1];
    
    let scoreHome = null;
    let scoreAway = null;
    if (homeTeam.score !== undefined && homeTeam.score !== null) scoreHome = parseInt(homeTeam.score);
    if (awayTeam.score !== undefined && awayTeam.score !== null) scoreAway = parseInt(awayTeam.score);
    
    return {
      id: `promiedos_${game.id}`,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      tournament: 'Copa de Primera',
      round: roundName || game.stage_round_name || 'Jornada',
      date: parsePromiedosDate(game.start_time),
      status: mapStatus(game.status?.name),
      scoreHome,
      scoreAway,
      homeLogo: homeTeam.id ? `https://api.promiedos.com.ar/images/team/${homeTeam.id}` : '',
      awayLogo: awayTeam.id ? `https://api.promiedos.com.ar/images/team/${awayTeam.id}` : '',
      stadium: '',
      events: [],
      lineupHome: [],
      lineupAway: [],
      gameTime: game.game_time_to_display || '',
      homeRedCards: homeTeam.red_cards || 0,
      awayRedCards: awayTeam.red_cards || 0,
    };
  });
}

/**
 * Extrae el __NEXT_DATA__ JSON de la página de Promiedos
 */
async function fetchPageData(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Promiedos error: ${res.status}`);
  
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextDataScript = $('#__NEXT_DATA__').html();
  
  if (!nextDataScript) throw new Error('No se encontró el JSON de Promiedos');
  
  return JSON.parse(nextDataScript);
}

/**
 * Obtiene todos los partidos de la fecha activa (la que Promiedos muestra por defecto).
 * Incluye próximos partidos, en vivo y finalizados de la ronda actual.
 */
export async function getPromiedosMatches() {
  try {
    const data = await fetchPageData(PROMIEDOS_URL);
    const filters = data.props?.pageProps?.data?.games?.filters;
    
    if (!filters || !Array.isArray(filters)) {
      throw new Error('Formato de datos de Promiedos cambiado');
    }
    
    // Get the current phase to assign it properly
    const activeFilter = filters.find(f => f.key !== 'latest' && f.games && f.games.length > 0);
    const filterKey = activeFilter?.key || '';
    
    let phase = 'Clausura'; // Fallback
    if (filterKey.includes('_3_')) phase = 'Apertura';
    if (filterKey.includes('_4_')) phase = 'Clausura';
    
    let allMatches = [];
    
    for (const filter of filters) {
      const roundName = filter.name || 'Jornada';
      if (filter.key === 'latest') continue;
      
      const games = parseGames(filter.games, roundName);
      const mappedGames = games.map(g => ({ 
        ...g, 
        tournament: 'Primera División de Paraguay',
        round: `${phase} - ${g.round}`
      }));
      allMatches.push(...mappedGames);
    }
    
    return allMatches;
  } catch (error) {
    console.error("Error scraping Promiedos:", error);
    return [];
  }
}

/**
 * Obtiene la lista de filtros/fechas disponibles para que el admin pueda elegir.
 * Retorna array de { name: 'Fecha 1', key: '621_152_4_1' }
 */
export async function getPromiedosRounds() {
  try {
    const data = await fetchPageData(PROMIEDOS_URL);
    const filters = data.props?.pageProps?.data?.games?.filters;
    
    if (!filters || !Array.isArray(filters)) return [];
    
    let currentPhase = 'Apertura';
    let phaseCount = 0;

    return filters
      .filter(f => f.key !== 'latest')
      .map(f => {
        if (f.name === 'Fecha 1') phaseCount++;
        if (phaseCount === 2) currentPhase = 'Clausura';
        
        return { 
          name: f.name, 
          key: f.key, 
          phase: currentPhase,
          hasGames: !!(f.games && f.games.length > 0) 
        };
      });
  } catch (error) {
    console.error("Error fetching rounds:", error);
    return [];
  }
}

/**
 * Obtiene los partidos de una fecha específica usando la API interna de Promiedos.
 * @param {string} filterKey - El key del filtro, ej: "621_152_4_1"
 * @param {string} phase - "Apertura" o "Clausura"
 */
export async function getPromiedosMatchesByRound(filterKey, phase = '') {
  try {
    const apiUrl = `https://api.promiedos.com.ar/league/games/gcb/${filterKey}`;
    
    const res = await fetch(apiUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`Promiedos API error: ${res.status}`);
    
    const apiData = await res.json();
    const gamesRaw = apiData.games;
    
    if (!gamesRaw || !Array.isArray(gamesRaw)) return [];
    
    // Convertir al mismo formato usando parseGames
    const games = parseGames(gamesRaw);
    
    return games.map(g => ({
      ...g,
      tournament: 'Primera División de Paraguay',
      round: phase ? `${phase} - ${g.round}` : g.round
    }));
  } catch (error) {
    console.error("Error fetching round:", error);
    return [];
  }
}

/**
 * Obtiene la tabla de posiciones de la Copa de Primera.
 */
export async function getPromiedosStandings() {
  try {
    const data = await fetchPageData(PROMIEDOS_URL);
    const tablesGroups = data.props?.pageProps?.data?.tables_groups;
    
    if (!tablesGroups || !Array.isArray(tablesGroups)) return [];
    
    // El primer grupo suele ser la tabla general
    const generalTable = tablesGroups[0]?.tables?.[0]?.table;
    if (!generalTable) return [];
    
    return generalTable.rows.map(row => ({
      position: row.num,
      team: row.entity?.object?.name || '',
      shortName: row.entity?.object?.short_name || '',
      teamId: row.entity?.object?.id || '',
      logo: row.entity?.object?.id ? `https://api.promiedos.com.ar/images/team/${row.entity.object.id}` : '',
      values: row.values?.reduce((acc, v) => { acc[v.key] = v.value; return acc; }, {}) || {}
    }));
  } catch (error) {
    console.error("Error fetching standings:", error);
    return [];
  }
}
