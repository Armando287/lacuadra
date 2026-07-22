"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (data.success) {
      // En una app real, guardaríamos token en cookies/localStorage
      router.push('/matches');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.loginCard}`}>
        <h2 className={styles.title}>Ingresar a La Cuadra</h2>
        <p className={styles.subtitle}>Ingresa tus datos o regístrate automáticamente.</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Entrar / Registrarse
          </button>
        </form>
      </div>
    </main>
  );
}
