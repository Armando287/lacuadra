export function calculateMatchPoints(vote, match) {
  if (match.status !== 'finished' || match.scoreHome === null || match.scoreAway === null) {
    return { points: 0, isExact: false };
  }

  const vHome = vote.predictedScoreHome;
  const vAway = vote.predictedScoreAway;
  const mHome = match.scoreHome;
  const mAway = match.scoreAway;

  // 10 pts: Resultado Exacto
  if (vHome === mHome && vAway === mAway) {
    return { points: 10, isExact: true };
  }

  const voteDiff = vHome - vAway;
  const matchDiff = mHome - mAway;

  const voteWinner = voteDiff > 0 ? 'home' : voteDiff < 0 ? 'away' : 'draw';
  const matchWinner = matchDiff > 0 ? 'home' : matchDiff < 0 ? 'away' : 'draw';

  // Si no acertó ni el ganador ni el empate
  if (voteWinner !== matchWinner) {
    return { points: 0, isExact: false };
  }

  // Si acertó el empate, pero no el resultado exacto (ya filtrado arriba)
  if (voteWinner === 'draw' && matchWinner === 'draw') {
    return { points: 7, isExact: false };
  }

  // Acertó el ganador. ¿Acertó la diferencia?
  if (voteDiff === matchDiff) {
    return { points: 8, isExact: false };
  }

  // Acertó solo el ganador
  return { points: 6, isExact: false };
}
