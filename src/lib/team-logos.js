// Mapping of Paraguayan Primera División team names to Promiedos team IDs
// Logos are stored locally in /public/logos/{id}.png
const TEAM_LOGOS = {
  '2 de Mayo':            'begec',
  'Rubio Ñú':             'ihhe',
  'Cerro Porteño':        'bcje',
  'Cerro':                'bcje',
  'Sportivo Trinidense':  'begea',
  'Recoleta FC':          'fdcaj',
  'Recoleta':             'fdcaj',
  'CS San Lorenzo':       'begde',
  'San Lorenzo':          'begde',
  'Sportivo Ameliano':    'fgfii',
  'Club Nacional':        'bcia',
  'Nacional':             'bcia',
  'Olimpia':              'ifei',
  'Libertad':             'bcig',
  'Club Guaraní':         'hhdj',
  'Guaraní':              'hhdj',
  'Sportivo Luqueño':     'ihhi',
};

/**
 * Get the local logo URL for a team name.
 * Returns a path to /logos/{id}.png served from Next.js public folder.
 */
export function getTeamLogoUrl(teamName) {
  if (!teamName) return '';

  // Direct match
  const id = TEAM_LOGOS[teamName];
  if (id) return `/logos/${id}.png`;

  // Case-insensitive match
  const lowerName = teamName.toLowerCase();
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    if (name.toLowerCase() === lowerName) return `/logos/${teamId}.png`;
  }

  // Partial match
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    if (lowerName.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerName)) {
      return `/logos/${teamId}.png`;
    }
  }

  return '';
}

export default TEAM_LOGOS;
