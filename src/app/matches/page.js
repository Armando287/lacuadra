"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './matches.module.css';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data.matches));
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Partidos Disponibles</h1>
      
      <div className={styles.grid}>
        {matches.map(match => (
          <Link href={`/matches/${match.id}`} key={match.id}>
            <div className={`glass-panel animate-fade-in ${styles.card}`}>
              <div className={styles.header}>
                <span className={styles.tournament}>{match.tournament}</span>
                <span className={`${styles.status} ${styles[match.status]}`}>
                  {match.status === 'live' ? 'EN VIVO' : 
                   match.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}
                </span>
              </div>
              
              <div className={styles.teams}>
                <div className={styles.team}>
                  <div className={styles.avatar}></div>
                  <span>{match.homeTeam}</span>
                </div>
                <div className={styles.score}>
                  {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : 'vs'}
                </div>
                <div className={styles.team}>
                  <div className={styles.avatar}></div>
                  <span>{match.awayTeam}</span>
                </div>
              </div>

              <div className={styles.footer}>
                <span>{new Date(match.date).toLocaleString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
