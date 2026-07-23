"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import Preloader from '@/components/Preloader';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Matches Fetcher (Promiedos)
  const [availableRounds, setAvailableRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');
  const [isLoadingRounds, setIsLoadingRounds] = useState(false);

  // States for Manual Matches Manager
  const [dbMatches, setDbMatches] = useState([]);
  const [filterPhase, setFilterPhase] = useState('');
  const [filterMatchday, setFilterMatchday] = useState('');
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [manualMatch, setManualMatch] = useState({
    home_team: '', away_team: '', score_home: '', score_away: '', 
    match_date: new Date().toISOString().slice(0, 16), 
    tournament: `Primera División de Paraguay Clausura ${new Date().getFullYear()}`, round: 'Fecha 1', status: 'upcoming'
  });

  useEffect(() => {
    // Client-side protection
    const isAdmin = localStorage.getItem('user_is_admin');
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchUsers();
    fetchMatches();
    fetchRounds();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const toggleBan = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_ban', userId: id, isBanned: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === id ? { ...u, is_banned: !currentStatus } : u));
      }
    } catch (e) { console.error(e); }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este usuario permanentemente?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: id })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const fetchRounds = async () => {
    setIsLoadingRounds(true);
    try {
      const res = await fetch('/api/admin/matches?action=get_rounds');
      const data = await res.json();
      if (data.success && data.rounds) {
        setAvailableRounds(data.rounds);
        // Seleccionar por defecto la primera ronda que tiene partidos
        const activeRound = data.rounds.find(r => r.hasGames);
        if (activeRound) setSelectedRound(activeRound.key);
      }
    } catch (e) {
      console.error('Error cargando rondas:', e);
    }
    setIsLoadingRounds(false);
  };

  const handleFetchMatches = async (e) => {
    e.preventDefault();
    setIsFetchingMatches(true);
    setMatchMessage('');
    try {
      const selectedRoundObj = availableRounds.find(r => r.key === selectedRound);
      const phase = selectedRoundObj ? selectedRoundObj.phase : '';

      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fetch_promiedos', 
          filterKey: selectedRound || undefined,
          phase: phase
        })
      });
      const data = await res.json();
      if (data.success) {
        setMatchMessage(`✅ Sincronización exitosa. Se guardaron ${data.count} partidos de Promiedos.`);
        fetchMatches();
      } else {
        setMatchMessage(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setMatchMessage('❌ Ocurrió un error al contactar con Promiedos.');
    }
    setIsFetchingMatches(false);
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/admin/matches');
      const data = await res.json();
      if (data.success) {
        setDbMatches(data.matches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualMatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const action = editingMatchId ? 'update_manual' : 'create_manual';
      const matchData = { ...manualMatch };
      if (editingMatchId) matchData.id = editingMatchId;
      
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, match: matchData })
      });
      const data = await res.json();
      if (data.success) {
        setMatchMessage(`Partido ${editingMatchId ? 'actualizado' : 'creado'} con éxito.`);
        fetchMatches(); // Reload table
        resetManualMatch();
      } else {
        setMatchMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      setMatchMessage('Ocurrió un error.');
    }
  };

  const editMatch = (m) => {
    setEditingMatchId(m.id);
    setManualMatch({
      home_team: m.home_team, away_team: m.away_team, 
      score_home: m.score_home !== null ? m.score_home : '', 
      score_away: m.score_away !== null ? m.score_away : '', 
      match_date: m.match_date ? new Date(m.match_date).toISOString().slice(0, 16) : '', 
      tournament: m.tournament, round: m.round, status: m.status
    });
    window.scrollTo(0, 0);
  };

  const deleteMatch = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este partido?')) return;
    try {
      const res = await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDbMatches(dbMatches.filter(m => m.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetManualMatch = () => {
    setEditingMatchId(null);
    setManualMatch({
      home_team: '', away_team: '', score_home: '', score_away: '', 
      match_date: new Date().toISOString().slice(0, 16), 
      tournament: `Primera División de Paraguay Clausura ${new Date().getFullYear()}`, round: 'Fecha 1', status: 'upcoming'
    });
  };

  const [activeTab, setActiveTab] = useState('sync');

  if (loading) return <Preloader text="CARGANDO PANEL..." />;

  return (
    <main className={styles.layout}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Admin <span>Panel</span></h2>
        
        <button 
          className={`${styles.tabBtn} ${activeTab === 'sync' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          🔄 Sincronizar Promiedos
        </button>
        
        <button 
          className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          ✏️ Gestión Manual
        </button>
        
        <button 
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={styles.content}>
        
        {/* TAB 1: MATCHES SYNC */}
        {activeTab === 'sync' && (
          <section className={styles.panel}>
            <h2>⚽ Sincronizar desde Promiedos</h2>
            <p style={{ marginBottom: '1.5rem', color: '#ccc', lineHeight: '1.6' }}>
              Seleccioná la fecha/jornada de la Copa de Primera de Paraguay y se extraerán los partidos directamente desde <strong style={{ color: '#4ecdc4' }}>Promiedos.com.ar</strong>.
            </p>
            <form onSubmit={handleFetchMatches} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Fecha / Jornada</label>
                {isLoadingRounds ? (
                  <p style={{ color: '#aaa' }}>Cargando fechas disponibles...</p>
                ) : (
                  <select 
                    value={selectedRound} 
                    onChange={(e) => setSelectedRound(e.target.value)} 
                    className={styles.input}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Fecha activa (actual) --</option>
                    {availableRounds.map(r => (
                      <option key={r.key} value={r.key}>
                        [{r.phase}] {r.name} {r.hasGames ? '✅' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn-primary" disabled={isFetchingMatches} style={{ marginTop: '1rem', padding: '1rem', flex: 1 }}>
                  {isFetchingMatches ? '⏳ Extrayendo de Promiedos...' : '🔄 Extraer y Guardar Partidos'}
                </button>
                <button type="button" className="btn-primary" onClick={fetchRounds} disabled={isLoadingRounds} style={{ marginTop: '1rem', padding: '1rem', background: '#333' }}>
                  🔃 Refrescar Fechas
                </button>
              </div>
            </form>
            {matchMessage && (
              <div className={styles.messageBlock}>
                {matchMessage}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MANUAL MATCHES */}
        {activeTab === 'manual' && (
          <section className={styles.panel}>
            <h2>Gestor Manual de Partidos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#ccc' }}>Agregar / Editar Partido</h3>
                <form onSubmit={handleManualMatchSubmit} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label>Equipo Local</label>
                    <input type="text" className={styles.input} value={manualMatch.home_team} onChange={e => setManualMatch({...manualMatch, home_team: e.target.value})} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Equipo Visitante</label>
                    <input type="text" className={styles.input} value={manualMatch.away_team} onChange={e => setManualMatch({...manualMatch, away_team: e.target.value})} required />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                      <label>Goles Local</label>
                      <input type="number" className={styles.input} value={manualMatch.score_home} onChange={e => setManualMatch({...manualMatch, score_home: e.target.value})} />
                    </div>
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                      <label>Goles Visitante</label>
                      <input type="number" className={styles.input} value={manualMatch.score_away} onChange={e => setManualMatch({...manualMatch, score_away: e.target.value})} />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Fecha y Hora</label>
                    <input type="datetime-local" className={styles.input} value={manualMatch.match_date} onChange={e => setManualMatch({...manualMatch, match_date: e.target.value})} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Torneo (Completo)</label>
                    <input type="text" className={styles.input} value={manualMatch.tournament} onChange={e => setManualMatch({...manualMatch, tournament: e.target.value})} required />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Jornada / Fecha</label>
                    <input type="text" className={styles.input} value={manualMatch.round} onChange={e => setManualMatch({...manualMatch, round: e.target.value})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Estado</label>
                    <select className={styles.input} value={manualMatch.status} onChange={e => setManualMatch({...manualMatch, status: e.target.value})}>
                      <option value="upcoming">Próximo</option>
                      <option value="live">En Vivo</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingMatchId ? 'Actualizar Partido' : 'Crear Partido'}</button>
                    {editingMatchId && (
                      <button type="button" className={styles.btnWarning} onClick={resetManualMatch} style={{ flex: 1 }}>Cancelar</button>
                    )}
                  </div>
                </form>
              </div>
              
              <div className={styles.tableContainer}>
                
                {/* FILTROS */}
                <div style={{ padding: '1rem', background: '#25262b', borderBottom: '1px solid #2C2D33', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#ccc' }}>Filtrar por Jornada:</strong>
                    <select 
                      className={styles.input} 
                      style={{ maxWidth: '200px', marginBottom: 0 }} 
                      value={filterPhase} 
                      onChange={e => setFilterPhase(e.target.value)}
                    >
                      <option value="">Todas las jornadas</option>
                      {[...new Set(dbMatches.map(m => {
                        const parts = (m.round || '').split(' - ');
                        if (parts.length === 2) return parts[0];
                        if (m.round?.includes('Clausura') || m.round?.includes('Apertura')) return m.round;
                        return '';
                      }))].filter(Boolean).map(phase => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#ccc' }}>Filtrar por Fecha:</strong>
                    <select 
                      className={styles.input} 
                      style={{ maxWidth: '200px', marginBottom: 0 }} 
                      value={filterMatchday} 
                      onChange={e => setFilterMatchday(e.target.value)}
                    >
                      <option value="">Todas las fechas</option>
                      {[...new Set(dbMatches.map(m => {
                        const parts = (m.round || '').split(' - ');
                        if (parts.length === 2) return parts[1];
                        if (!m.round?.includes('Clausura') && !m.round?.includes('Apertura')) return m.round;
                        return '';
                      }))].filter(Boolean).map(md => (
                        <option key={md} value={md}>{md}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Partido</th>
                      <th>Estado</th>
                      <th>Torneo</th>
                      <th>Jornada</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbMatches.filter(m => {
                      const parts = (m.round || '').split(' - ');
                      let mPhase = '';
                      let mMatchday = '';
                      if (parts.length === 2) {
                        mPhase = parts[0];
                        mMatchday = parts[1];
                      } else {
                        if (m.round?.includes('Clausura') || m.round?.includes('Apertura')) {
                          mPhase = m.round;
                        } else {
                          mMatchday = m.round;
                        }
                      }
                      
                      const matchPhase = filterPhase === '' || mPhase === filterPhase;
                      const matchMatchday = filterMatchday === '' || mMatchday === filterMatchday;
                      return matchPhase && matchMatchday;
                    }).map(m => {
                      const parts = (m.round || '').split(' - ');
                      let mPhase = '';
                      let mMatchday = '';
                      if (parts.length === 2) {
                        mPhase = parts[0];
                        mMatchday = parts[1].replace('Fecha ', '');
                      } else {
                        if (m.round?.includes('Clausura') || m.round?.includes('Apertura')) {
                          mPhase = m.round;
                        } else {
                          mMatchday = (m.round || '').replace('Fecha ', '');
                        }
                      }
                      
                      return (
                      <tr key={m.id}>
                        <td>{new Date(m.match_date).toLocaleString()}</td>
                        <td>
                          <strong>{m.home_team} {m.score_home !== null ? m.score_home : '-'}</strong> vs <strong>{m.score_away !== null ? m.score_away : '-'} {m.away_team}</strong>
                        </td>
                        <td>{m.status}</td>
                        <td>{m.tournament}</td>
                        <td>{mPhase}</td>
                        <td>{mMatchday}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.btnWarning} onClick={() => editMatch(m)}>Editar</button>
                            <button className={styles.btnDanger} onClick={() => deleteMatch(m.id)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {dbMatches.filter(m => {
                      const parts = (m.round || '').split(' - ');
                      let mPhase = '';
                      let mMatchday = '';
                      if (parts.length === 2) {
                        mPhase = parts[0];
                        mMatchday = parts[1];
                      } else {
                        if (m.round?.includes('Clausura') || m.round?.includes('Apertura')) {
                          mPhase = m.round;
                        } else {
                          mMatchday = m.round;
                        }
                      }
                      return (filterPhase === '' || mPhase === filterPhase) && (filterMatchday === '' || mMatchday === filterMatchday);
                    }).length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>No hay partidos que coincidan con el filtro.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: USERS MANAGER */}
        {activeTab === 'users' && (
          <section className={styles.panel}>
            <h2>Gestión de Usuarios</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Club</th>
                    <th>Puntos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatar_url} alt="avatar" width="30" height="30" style={{ borderRadius: '50%' }} />
                          {u.username} {u.is_admin && '👑'}
                        </div>
                      </td>
                      <td>{u.favorite_club || '-'}</td>
                      <td>{u.points}</td>
                      <td>
                        <span className={u.is_banned ? styles.badgeDanger : styles.badgeSuccess}>
                          {u.is_banned ? 'Baneado' : 'Activo'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            onClick={() => toggleBan(u.id, u.is_banned)}
                            className={u.is_banned ? styles.btnSuccess : styles.btnWarning}
                            disabled={u.is_admin}
                          >
                            {u.is_banned ? 'Desbanear' : 'Banear'}
                          </button>
                          <button 
                            onClick={() => deleteUser(u.id)}
                            className={styles.btnDanger}
                            disabled={u.is_admin}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No hay usuarios.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
