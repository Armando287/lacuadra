// Mapping of Paraguayan Primera División team names to Promiedos team IDs
// Used to generate logo URLs for manually created matches
const TEAM_LOGOS = {
  '2 de Mayo': 'begec',
  'Rubio Ñú': 'ihhe',
  'Cerro Porteño': 'bcje',
  'Cerro': 'bcje',
  'Sportivo Trinidense': 'begea',
  'Recoleta FC': 'fdcaj',
  'Recoleta': 'fdcaj',
  'CS San Lorenzo': 'begde',
  'San Lorenzo': 'begde',
  'Sportivo Ameliano': 'fgfii',
  'Club Nacional': 'bcia',
  'Nacional': 'bcia',
  'Olimpia': 'ifei',
  'Libertad': 'bcig',
  'Club Guaraní': 'hhdj',
  'Guaraní': 'hhdj',
  'Sportivo Luqueño': 'ihhi',
};

/**
 * Get the Promiedos logo URL for a team name.
 * Returns the URL if found, or empty string if not.
 */
export function getTeamLogoUrl(teamName) {
  if (!teamName) return '';
  
  // Direct match
  const id = TEAM_LOGOS[teamName];
  if (id) return `https://api.promiedos.com.ar/images/team/${id}/1`;
  
  // Case-insensitive match
  const lowerName = teamName.toLowerCase();
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    if (name.toLowerCase() === lowerName) {
      return `https://api.promiedos.com.ar/images/team/${teamId}/1`;
    }
  }
  
  // Partial match (team name contains or is contained by a key)
  for (const [name, teamId] of Object.entries(TEAM_LOGOS)) {
    if (lowerName.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerName)) {
      return `https://api.promiedos.com.ar/images/team/${teamId}/1`;
    }
  }
  
  return '';
}

export default TEAM_LOGOS;
