"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './match-detail.module.css';

export default function MatchDetail() {
  const params = useParams();
  const [match, setMatch] = useState(null);
  const [voteHome, setVoteHome] = useState('');
  const [voteAway, setVoteAway] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        const found = data.matches.find(m => m.id === params.id);
        setMatch(found);
      });
  }, [params.id]);

  const handleVote = async (e) => {
    e.preventDefault();
    const userId = "1"; // Mocked logged in user for demo
    
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        matchId: match.id,
        predictedScoreHome: parseInt(voteHome),
        predictedScoreAway: parseInt(voteAway)
      })
    });
    
    const data = await res.json();
    if (data.success) {
      setMessage('¡Voto registrado con éxito!');
    } else {
      setMessage(`Error: ${data.error}`);
    }
  };

  if (!match) return <div className={styles.loading}>Cargando...</div>;

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.scoreboard}`}>
        <div className={styles.headerInfo}>
          <span>{match.tournament}</span>
          <span>{new Date(match.date).toLocaleString()}</span>
        </div>
        <div className={styles.teams}>
          <div className={styles.team}>
            <div className={styles.logoLg}></div>
            <h2>{match.homeTeam}</h2>
          </div>
          <div className={styles.scoreContainer}>
            <div className={styles.score}>
              {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : 'VS'}
            </div>
            <div className={`${styles.status} ${styles[match.status]}`}>
              {match.status === 'live' ? 'EN VIVO' : 
               match.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}
            </div>
          </div>
          <div className={styles.team}>
            <div className={styles.logoLg}></div>
            <h2>{match.awayTeam}</h2>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftColumn}>
          <div className={`glass-panel ${styles.votingPanel}`}>
            <h3 className={styles.panelTitle}>Predicción (La Polla)</h3>
            <p>Vota por el resultado exacto. Tienes hasta 1 hora antes del partido.</p>
            
            <form onSubmit={handleVote} className={styles.voteForm}>
              <div className={styles.voteInputs}>
                <div className={styles.inputGroup}>
                  <label>{match.homeTeam}</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={voteHome} 
                    onChange={e => setVoteHome(e.target.value)}
                  />
                </div>
                <span>-</span>
                <div className={styles.inputGroup}>
                  <label>{match.awayTeam}</label>
                  <input 
                    type="number" 
                    min="0" 
                    required 
                    value={voteAway} 
                    onChange={e => setVoteAway(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Guardar Predicción</button>
              {message && <div className={styles.message}>{message}</div>}
            </form>
          </div>

          <div className={`glass-panel ${styles.pitchPanel}`}>
            <h3 className={styles.panelTitle}>Alineaciones</h3>
            <div className={styles.lineups}>
              <div className={styles.lineup}>
                <h4>{match.homeTeam}</h4>
                <ul>
                  {match.lineupHome.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div className={styles.lineup}>
                <h4>{match.awayTeam}</h4>
                <ul>
                  {match.lineupAway.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={`glass-panel ${styles.timelinePanel}`}>
            <h3 className={styles.panelTitle}>Eventos en Vivo</h3>
            <div className={styles.timeline}>
              {match.events.length === 0 ? (
                <p>No hay eventos registrados aún.</p>
              ) : (
                match.events.map((ev, i) => (
                  <div key={i} className={styles.event}>
                    <span className={styles.eventTime}>{ev.time}</span>
                    <div className={styles.eventDetails}>
                      <span className={styles.eventType}>
                        {ev.type === 'goal' ? '⚽ Gol' : 
                         ev.type === 'yellow_card' ? '🟨 Tarjeta' : ev.type}
                      </span>
                      <span className={styles.eventPlayer}>{ev.player} ({ev.team})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
