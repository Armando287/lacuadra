"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './matches.module.css';

export default function MatchesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [matches, setMatches] = useState([]);
  
  // Filter States
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedRound, setSelectedRound] = useState('');

  // Dropdown options
  const [tournaments, setTournaments] = useState([]);
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    fetch(`/api/matches?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        if (!data.matches) return;
        setMatches(data.matches);
        
        // Extract unique tournaments
        const t = [...new Set(data.matches.map(m => m.tournament))];
        setTournaments(t);
        if (t.length > 0 && !t.includes(selectedTournament)) {
          setSelectedTournament(t[0]);
        }
      });
  }, [selectedYear]);

  // When tournament changes, extract rounds and set active round
  useEffect(() => {
    if (!selectedTournament || matches.length === 0) return;
    
    const tournamentMatches = matches.filter(m => m.tournament === selectedTournament);
    const r = [...new Set(tournamentMatches.map(m => m.round))];
    setRounds(r);

    // Determine the "Active Round" (the first one with an upcoming/live match)
    let activeRound = r[0];
    for (let roundName of r) {
      const rm = tournamentMatches.filter(m => m.round === roundName);
      if (rm.some(m => m.status === 'upcoming' || m.status === 'live')) {
        activeRound = roundName;
        break;
      }
    }
    setSelectedRound(activeRound || r[r.length - 1]);
  }, [selectedTournament, matches]);

  // Derived filtered matches
  const filteredMatches = matches
    .filter(m => m.tournament === selectedTournament && m.round === selectedRound)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Check if the selected round is the active round
  const [activeRound, setActiveRound] = useState('');
  useEffect(() => {
    if (!selectedTournament || matches.length === 0 || rounds.length === 0) return;
    const tournamentMatches = matches.filter(m => m.tournament === selectedTournament);
    let currentActive = rounds[0];
    for (let roundName of rounds) {
      const rm = tournamentMatches.filter(m => m.round === roundName);
      if (rm.some(m => m.status === 'upcoming' || m.status === 'live')) {
        currentActive = roundName;
        break;
      }
    }
    setActiveRound(currentActive);
  }, [selectedTournament, matches, rounds]);

  const isRoundActive = selectedRound === activeRound;

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Centro de Partidos</h1>
      
      {/* Filter Bar */}
      <div className={`glass-panel ${styles.filterBar}`}>
        <div className={styles.filterGroup}>
          <label>Temporada:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Torneo:</label>
          <select 
            value={selectedTournament} 
            onChange={(e) => setSelectedTournament(e.target.value)}
            className={styles.select}
          >
            {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha (Jornada):</label>
          <select 
            value={selectedRound} 
            onChange={(e) => setSelectedRound(e.target.value)}
            className={styles.select}
          >
            {rounds.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      
      <div className={styles.grid}>
        {filteredMatches.map(match => (
          <Link href={`/matches/${match.id}?active=${isRoundActive}`} key={match.id}>
            <div className={`glass-panel animate-fade-in ${styles.card}`}>
              <div className={styles.cardContent}>
                <div className={styles.header}>
                  <span className={styles.tournament}>{match.round || match.tournament}</span>
                  <span className={`${styles.status} ${styles[match.status]}`}>
                    {match.status === 'live' && <span className="status-dot live"></span>}
                    {match.status === 'live' ? 'EN VIVO' : 
                     match.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}
                  </span>
                </div>
                
                <div className={styles.teams}>
                  <div className={styles.team}>
                    <div className={styles.avatar}>
                      {match.homeLogo ? <img src={match.homeLogo} alt={match.homeTeam} className={styles.avatarImg} /> : null}
                    </div>
                    <span>{match.homeTeam}</span>
                  </div>
                  <div className={styles.score}>
                    {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : <span className={styles.vs}>VS</span>}
                  </div>
                  <div className={styles.team}>
                    <div className={styles.avatar}>
                      {match.awayLogo ? <img src={match.awayLogo} alt={match.awayTeam} className={styles.avatarImg} /> : null}
                    </div>
                    <span>{match.awayTeam}</span>
                  </div>
                </div>

                <div className={styles.footer}>
                  <span>{new Date(match.date).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filteredMatches.length === 0 && (
          <div className={styles.noMatches}>No hay partidos programados para esta fecha.</div>
        )}
      </div>
    </main>
  );
}
