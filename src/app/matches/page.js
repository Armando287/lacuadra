"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './matches.module.css';
import Preloader from '@/components/Preloader';
import { getTeamLogoUrl } from '@/lib/team-logos';

export default function MatchesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedRound, setSelectedRound] = useState('');

  // Dropdown options
  const [tournaments, setTournaments] = useState([]);
  const [phases, setPhases] = useState([]);
  const [rounds, setRounds] = useState([]);

  // Helper function to extract phase and matchday from round string
  const parseRound = (roundStr) => {
    if (!roundStr) return { phase: '', matchday: '' };
    const parts = roundStr.split(' - ');
    if (parts.length === 2) return { phase: parts[0], matchday: parts[1] };
    if (roundStr.includes('Clausura') || roundStr.includes('Apertura')) return { phase: roundStr, matchday: '' };
    return { phase: '', matchday: roundStr };
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches?year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        if (!data.matches) {
          setLoading(false);
          return;
        }
        setMatches(data.matches);
        
        // Extract unique tournaments
        const t = [...new Set(data.matches.map(m => m.tournament))];
        setTournaments(t);
        if (t.length > 0 && (!selectedTournament || !t.includes(selectedTournament))) {
          setSelectedTournament(t[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedYear]);

  // When tournament changes, extract phases and rounds
  useEffect(() => {
    if (!selectedTournament || matches.length === 0) return;
    
    // Filter matches that belong to the tournament
    const tournamentMatches = matches.filter(m => m.tournament === selectedTournament);
    
    // Extract phases for this tournament from the round string
    const p = [...new Set(tournamentMatches.map(m => parseRound(m.round).phase).filter(Boolean))];
    setPhases(p);
    
    let activePhase = p[0] || '';
    if (p.length > 0) {
      if (!selectedPhase || !p.includes(selectedPhase)) {
        activePhase = p[0];
        setSelectedPhase(activePhase);
      } else {
        activePhase = selectedPhase;
      }
    } else {
      setSelectedPhase('');
    }

    // Filter matches by tournament AND phase
    const phaseMatches = tournamentMatches.filter(m => parseRound(m.round).phase === activePhase);
    const r = [...new Set(phaseMatches.map(m => parseRound(m.round).matchday).filter(Boolean))];
    setRounds(r);

    // Determine the "Active Round" (the first one with an upcoming/live match)
    let activeRound = r[0];
    for (let roundName of r) {
      const rm = phaseMatches.filter(m => parseRound(m.round).matchday === roundName);
      if (rm.some(m => m.status === 'upcoming' || m.status === 'live')) {
        activeRound = roundName;
        break;
      }
    }
    setSelectedRound(activeRound || r[r.length - 1]);
  }, [selectedTournament, selectedPhase, matches]);

  // Derived filtered matches
  const filteredMatches = matches
    .filter(m => {
      const parsed = parseRound(m.round);
      if (m.tournament !== selectedTournament || parsed.phase !== selectedPhase) return false;
      if (rounds.length > 0 && parsed.matchday !== selectedRound) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Check if the selected round is the active round
  const [activeRound, setActiveRound] = useState('');
  useEffect(() => {
    if (!selectedTournament || matches.length === 0 || rounds.length === 0) return;
    const phaseMatches = matches.filter(m => {
      const parsed = parseRound(m.round);
      return m.tournament === selectedTournament && parsed.phase === selectedPhase;
    });
    let currentActive = rounds[0];
    for (let roundName of rounds) {
      const rm = phaseMatches.filter(m => parseRound(m.round).matchday === roundName);
      if (rm.some(m => m.status === 'upcoming' || m.status === 'live')) {
        currentActive = roundName;
        break;
      }
    }
    setActiveRound(currentActive);
  }, [selectedTournament, selectedPhase, matches, rounds]);

  const isRoundActive = selectedRound === activeRound;

  // Tabs
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'predictions'
  const [myVotes, setMyVotes] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      setUserId(token);
      fetch(`/api/votes?userId=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.votes) setMyVotes(data.votes);
        })
        .catch(e => console.error(e));
    }
  }, []);

  const getMatchForVote = (matchId) => {
    return matches.find(m => m.id === matchId);
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Centro de Partidos</h1>
      
      <div className={styles.tabsContainer} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn-primary`} 
          style={{ background: activeTab === 'matches' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'matches' ? 'var(--bg-dark)' : 'var(--text-main)', border: '1px solid var(--primary-color)' }}
          onClick={() => setActiveTab('matches')}
        >
          Lista de Partidos
        </button>
        <button 
          className={`btn-primary`} 
          style={{ background: activeTab === 'predictions' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'predictions' ? 'var(--bg-dark)' : 'var(--text-main)', border: '1px solid var(--primary-color)' }}
          onClick={() => setActiveTab('predictions')}
        >
          Mis Predicciones
        </button>
      </div>

      {activeTab === 'matches' && (
        <>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
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
                disabled={tournaments.length === 0}
              >
                {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {phases.length > 0 && (
              <div className={styles.filterGroup}>
                <label>Fase:</label>
                <select 
                  value={selectedPhase} 
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className={styles.select}
                >
                  {phases.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div className={styles.filterGroup}>
              <label>Fecha (Jornada):</label>
              <select 
                value={selectedRound} 
                onChange={(e) => setSelectedRound(e.target.value)}
                className={styles.select}
                disabled={rounds.length === 0}
              >
                {rounds.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          
          {loading ? (
            <Preloader text="CARGANDO PARTIDOS..." />
          ) : (
            <div className={styles.grid}>
              {filteredMatches.map(match => (
                <Link href={`/matches/${match.id}?active=${isRoundActive}`} key={match.id}>
                  <div className={`glass-panel animate-fade-in ${styles.card}`}>
                    <div className={styles.cardContent}>
                      <div className={styles.header}>
                        <span className={styles.tournament}>{parseRound(match.round).matchday || parseRound(match.round).phase || match.tournament}</span>
                        <span className={`${styles.status} ${styles[match.status]}`}>
                          {match.status === 'live' && <span className="status-dot live"></span>}
                          {match.status === 'live' ? 'EN VIVO' : 
                           match.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMO'}
                        </span>
                      </div>
                      
                      <div className={styles.teams}>
                        <div className={styles.team}>
                          <div className={styles.avatar}>
                            {(match.homeLogo || getTeamLogoUrl(match.homeTeam)) && <img src={match.homeLogo || getTeamLogoUrl(match.homeTeam)} alt={match.homeTeam} className={styles.avatarImg} />}
                          </div>
                          <span>{match.homeTeam}</span>
                        </div>
                        <div className={styles.score}>
                          {match.scoreHome !== null ? `${match.scoreHome} - ${match.scoreAway}` : <span className={styles.vs}>VS</span>}
                        </div>
                        <div className={styles.team}>
                          <div className={styles.avatar}>
                            {(match.awayLogo || getTeamLogoUrl(match.awayTeam)) && <img src={match.awayLogo || getTeamLogoUrl(match.awayTeam)} alt={match.awayTeam} className={styles.avatarImg} />}
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
          )}
        </>
      )}

      {activeTab === 'predictions' && (
        <div>
          {!userId ? (
            <div className={`glass-panel`} style={{ padding: '2rem', textAlign: 'center' }}>
              Inicia sesión para ver tus predicciones.
            </div>
          ) : myVotes.length === 0 ? (
            <div className={`glass-panel`} style={{ padding: '2rem', textAlign: 'center' }}>
              Aún no tienes predicciones activas. ¡Ve a la Lista de Partidos y vota!
            </div>
          ) : (
            <div className={styles.grid}>
              {myVotes.map(vote => {
                const match = getMatchForVote(vote.match_id);
                if (!match) return null;
                return (
                  <Link href={`/matches/${match.id}`} key={vote.id}>
                    <div className={`glass-panel animate-fade-in ${styles.card}`} style={{ border: '2px solid rgba(0, 245, 118, 0.3)' }}>
                      <div className={styles.cardContent}>
                        <div className={styles.header}>
                          <span className={styles.tournament}>{parseRound(match.round).matchday || match.tournament}</span>
                          <span className={`${styles.status} ${styles[match.status]}`}>
                            {match.status === 'live' ? 'EN JUEGO' : 
                             match.status === 'finished' ? 'CERRADA' : 'ACTIVA (Click para editar)'}
                          </span>
                        </div>
                        
                        <div className={styles.teams}>
                          <div className={styles.team}>
                            <div className={styles.avatar}>
                              {match.homeLogo ? <img src={match.homeLogo} alt={match.homeTeam} className={styles.avatarImg} /> : null}
                            </div>
                            <span>{match.homeTeam}</span>
                          </div>
                          <div className={styles.score} style={{ color: 'var(--primary-color)' }}>
                            {vote.predicted_score_home} - {vote.predicted_score_away}
                          </div>
                          <div className={styles.team}>
                            <div className={styles.avatar}>
                              {match.awayLogo ? <img src={match.awayLogo} alt={match.awayTeam} className={styles.avatarImg} /> : null}
                            </div>
                            <span>{match.awayTeam}</span>
                          </div>
                        </div>

                        <div className={styles.footer} style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Partido: {match.homeTeam} vs {match.awayTeam} - {new Date(match.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
