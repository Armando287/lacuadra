"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (data.matches && data.matches.length > 0) {
          // Filtrar torneo activo
          const activeTournaments = [...new Set(data.matches.filter(m => m.status === 'live' || m.status === 'upcoming').map(m => m.tournament))];
          
          let filtered = [];
          // Si hay torneo activo, usarlo. Si no, tomar el último torneo disponible
          const targetTournament = activeTournaments.length > 0 
            ? activeTournaments[0] 
            : [...new Set(data.matches.map(m => m.tournament))].pop();

          if (targetTournament) {
            const tMatches = data.matches.filter(m => m.tournament === targetTournament).sort((a, b) => new Date(a.date) - new Date(b.date));
            const rounds = [...new Set(tMatches.map(m => m.round))];
            
            // Buscar la primera jornada activa o, si no hay, tomar la última jornada
            const firstActiveMatch = tMatches.find(m => m.status === 'live' || m.status === 'upcoming');
            const currentRound = firstActiveMatch ? firstActiveMatch.round : rounds[rounds.length - 1];
            
            if (currentRound) {
              const currentIndex = rounds.indexOf(currentRound);
              const roundsToShow = [currentRound];
              if (currentIndex > 0) roundsToShow.unshift(rounds[currentIndex - 1]); // Agregar la fecha anterior
              
              filtered = tMatches.filter(m => roundsToShow.includes(m.round));
            } else {
              filtered = tMatches;
            }
          }

          setMatches([...filtered, ...filtered]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  if (!mounted) return null;

  return (
    <main className={styles.main}>
      {/* Stadium Background Overlay */}
      <div className={styles.stadiumBg}></div>

      {/* Central Immersive Hero */}
      <div className={styles.heroCenter}>
        <div className={styles.badge}>Nueva Temporada {new Date().getFullYear()}</div>
        <h1 className={styles.massiveTitle}>
          LA <span className={styles.highlight}>CUADRA</span>
        </h1>
        <p className={styles.heroDescription}>
          Demuestra cuánto sabes de fútbol paraguayo. Predice resultados, suma puntos y sube en el ranking global.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/login" className={`btn-primary ${styles.glowBtn}`}>
            Jugar Ahora
          </Link>
          <Link href="/matches" className="btn-secondary">
            Ver Partidos en Vivo
          </Link>
        </div>
      </div>

      {/* Floating 3D Cards / Elements */}
      <div className={styles.floatingElements}>
        <div className={`${styles.floatCard} ${styles.cardLeft}`}>
           🏆 Copa Paraguay
        </div>
        <div className={`${styles.floatCard} ${styles.cardRight}`}>
           ⚡ Resultados en Vivo
        </div>
        <div className={`${styles.floatCard} ${styles.cardBottom}`}>
           📊 Ranking Global
        </div>
      </div>

      {/* Live Matches Ticker */}
      {matches.length > 0 && (
        <div className={styles.tickerWrapper}>
          <div className={styles.tickerTrack}>
            {matches.map((match, idx) => (
              <div key={idx} className={styles.tickerItem}>
                <span className={styles.tickerTournament}>{match.tournament}</span>
                <span className={styles.tickerTeams}>
                  {match.homeLogo && <img src={match.homeLogo} alt={match.homeTeam} className={styles.tickerLogo} />}
                  {match.homeTeam} 
                  <span className={styles.tickerScore}>
                    {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : 'vs'}
                  </span> 
                  {match.awayTeam}
                  {match.awayLogo && <img src={match.awayLogo} alt={match.awayTeam} className={styles.tickerLogo} />}
                </span>
                {match.status === 'live' && <span className="status-dot live"></span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
