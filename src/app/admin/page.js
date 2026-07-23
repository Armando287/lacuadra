"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Matches Fetcher
  const [tournament, setTournament] = useState('Primera División de Paraguay');
  const [round, setRound] = useState('Clausura');
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');

  // States for Manual Matches Manager
  const [dbMatches, setDbMatches] = useState([]);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [manualMatch, setManualMatch] = useState({
    home_team: '', away_team: '', score_home: '', score_away: '', 
    match_date: new Date().toISOString().slice(0, 16), 
    tournament: 'Primera División de Paraguay', round: 'Fecha 1', status: 'upcoming'
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
  }, [router]);

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
      tournament: 'Primera División de Paraguay', round: 'Fecha 1', status: 'upcoming'
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Cargando Panel Admin...</div>;

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Panel de Administración</h1>

      <div className={styles.grid}>
        {/* MATCHES MANAGER */}
        <section className={`glass-panel ${styles.panel}`}>
          <h2>Sincronizar Partidos</h2>
          <p style={{ marginBottom: '1rem', color: '#ccc' }}>
            Usa esta herramienta para buscar una fecha en Google y guardarla permanentemente en tu base de datos. Esto ahorra consultas de API y hace que la app vuele para los usuarios.
          </p>
          <form onSubmit={handleFetchMatches} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Torneo</label>
              <input 
                type="text" 
                value={tournament} 
                onChange={(e) => setTournament(e.target.value)} 
                required 
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Fecha / Jornada (Opcional)</label>
              <input 
                type="text" 
                value={round} 
                onChange={(e) => setRound(e.target.value)} 
                placeholder="Ej. Clausura, Apertura, Fecha 1..."
                className={styles.input}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isFetchingMatches}>
              {isFetchingMatches ? 'Buscando y Sincronizando...' : 'Extraer de Google y Guardar'}
            </button>
          </form>
          {matchMessage && (
            <div className={styles.messageBlock}>
              {matchMessage}
            </div>
          )}
        </section>

        {/* USERS MANAGER */}
        <section className={`glass-panel ${styles.panel}`}>
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

        {/* MANUAL MATCHES MANAGER */}
        <section className={`glass-panel ${styles.panel}`} style={{ gridColumn: '1 / -1' }}>
          <h2>Gestor Manual de Partidos</h2>
          <div className={styles.grid}>
            <div>
              <h3>Agregar / Editar Partido</h3>
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
                  <label>Torneo</label>
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
              <h3>Partidos Guardados</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Partido</th>
                    <th>Estado</th>
                    <th>Torneo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dbMatches.map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.match_date).toLocaleString()}</td>
                      <td>
                        <strong>{m.home_team} {m.score_home !== null ? m.score_home : '-'}</strong> vs <strong>{m.score_away !== null ? m.score_away : '-'} {m.away_team}</strong>
                      </td>
                      <td>{m.status}</td>
                      <td>{m.tournament} {m.round}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.btnWarning} onClick={() => editMatch(m)}>Editar</button>
                          <button className={styles.btnDanger} onClick={() => deleteMatch(m.id)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dbMatches.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay partidos en la base de datos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
