"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const CLUBS = [
  "Cerro Porteño", "Olimpia", "Libertad", "Guaraní", 
  "Nacional Asuncion", "Sportivo Luqueño", "Sportivo Ameliano", 
  "Sportivo Trinidense", "Tacuary", "Sol de América", 
  "2 de Mayo", "General Caballero JLM"
];

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [favoriteClub, setFavoriteClub] = useState(CLUBS[0]);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { username, password, isRegister: isRegistering };
    if (isRegistering) {
      payload.favoriteClub = favoriteClub;
    }

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('user_token', data.user.id);
      localStorage.setItem('user_name', data.user.username);
      router.push('/matches');
    } else {
      setError(data.error || 'Ocurrió un error');
    }
  };

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.loginContainer}`}>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${!isRegistering ? styles.activeTab : ''}`}
            onClick={() => { setIsRegistering(false); setError(''); }}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`${styles.tabBtn} ${isRegistering ? styles.activeTab : ''}`}
            onClick={() => { setIsRegistering(true); setError(''); }}
          >
            Registrarse
          </button>
        </div>

        <h2 className={styles.title}>La Cuadra</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Usuario</label>
            <input 
              type="text" 
              className={styles.input}
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input 
              type="password" 
              className={styles.input}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          {isRegistering && (
            <div className={styles.inputGroup}>
              <label>Tu Club (Batalla de Hinchadas)</label>
              <select 
                className={styles.input}
                value={favoriteClub}
                onChange={e => setFavoriteClub(e.target.value)}
                required
              >
                {CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={`btn-primary ${styles.submitBtn}`}>
            {isRegistering ? 'Crear Cuenta' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
