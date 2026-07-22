"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    setMounted(true);
    // Fetch latest matches for the ticker
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          // Double the array to make the infinite scroll smooth
          setMatches([...data.matches, ...data.matches]);
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
        <div className={styles.badge}>Nueva Temporada 2024</div>
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
                  {match.homeTeam} 
                  <span className={styles.tickerScore}>
                    {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : 'vs'}
                  </span> 
                  {match.awayTeam}
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
