// Mapping of Paraguayan Primera División team names to Promiedos team IDs
// Logos are stored locally in /public/logos/{id}.png
const TEAM_LOGOS = {
  '2 de Mayo':            'begec',
  'Rubio Ñú':             'ihhe',
  'Rubio Ñu':             'ihhe',
  'Rubio Nu':             'ihhe',
  'Cerro Porteño':        'bcje',
  'Cerro':                'bcje',
  'Sportivo Trinidense':  'begea',
  'Trinidense':           'begea',
  'Recoleta FC':          'fdcaj',
  'Deportivo Recoleta':   'fdcaj',
  'Recoleta':             'fdcaj',
  'CS San Lorenzo':       'begde',
  'Sportivo San Lorenzo': 'begde',
  'San Lorenzo':          'begde',
  'Sportivo Ameliano':    'fgfii',
  'Ameliano':             'fgfii',
  'Club Nacional':        'bcia',
  'Nacional':             'bcia',
  'Olimpia':              'ifei',
  'Libertad':             'bcig',
  'Club Guaraní':         'hhdj',
  'Guaraní':              'hhdj',
  'Guarani':              'hhdj',
  'Sportivo Luqueño':     'ihhi',
  'Luqueño':              'ihhi',
  'Luqueno':              'ihhi',
};

/**
 * Get the local logo URL for a team name.
 * Returns a path to /logos/{id}.png served from Next.js public folder.
 */
export function getTeamLogoUrl(teamName) {
  if (!teamName) return '';

  const cleanName = teamName.trim();

  // Direct match
  const id = TEAM_LOGOS[cleanName];
  if (id) return `/logos/${id}.png`;

  // Normalize string (remove accents/diacritics)
  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const lowerName = normalize(cleanName);
  
  // Case-insensitive & accent-insensitive match
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    if (normalize(name) === lowerName) return `/logos/${teamId}.png`;
  }

  // Partial match
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    const normName = normalize(name);
    if (lowerName.includes(normName) || normName.includes(lowerName)) {
      return `/logos/${teamId}.png`;
    }
  }

  return '';
}

export default TEAM_LOGOS;
