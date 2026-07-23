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

  useEffect(() => {
    // Client-side protection
    const isAdmin = localStorage.getItem('user_is_admin');
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_banned: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === id ? { ...u, is_banned: !currentStatus } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchMatches = async (e) => {
    e.preventDefault();
    setIsFetchingMatches(true);
    setMatchMessage('Buscando partidos en Google y procesando logos... Esto puede tomar unos segundos.');

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_google', tournament, round })
      });
      const data = await res.json();
      
      if (data.success) {
        setMatchMessage(`¡Éxito! Se encontraron y guardaron ${data.count} partidos en la base de datos.`);
      } else {
        setMatchMessage(`Error: ${data.error}`);
      }
    } catch (e) {
      setMatchMessage('Ocurrió un error de red.');
      console.error(e);
    } finally {
      setIsFetchingMatches(false);
    }
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
      </div>
    </main>
  );
}
