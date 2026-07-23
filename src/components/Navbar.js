"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('user_name');
    if (name) {
      setUsername(name);
    }
    const adminFlag = localStorage.getItem('user_is_admin');
    if (adminFlag === 'true') {
      setIsAdmin(true);
    }
  }, [pathname]); // Refresh when route changes

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
    setUsername(null);
    setIsAdmin(false);
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">
            <img src="/logo.png" alt="La Cuadra" style={{ height: '40px', width: 'auto' }} />
          </Link>
        </div>
        <div className={styles.links}>
          {isAdmin && (
            <Link href="/admin" className={`${styles.link} ${pathname === '/admin' ? styles.active : ''}`} style={{ color: 'var(--accent)' }}>
              👑 Admin Panel
            </Link>
          )}
          <Link href="/matches" className={`${styles.link} ${pathname === '/matches' ? styles.active : ''}`}>
            Partidos
          </Link>
          <Link href="/leaderboard" className={`${styles.link} ${pathname === '/leaderboard' ? styles.active : ''}`}>
            Ranking
          </Link>
          <Link href="/rules" className={`${styles.link} ${pathname === '/rules' ? styles.active : ''}`}>
            Reglas
          </Link>
          
          {username ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>👤 {username}</span>
              <button onClick={handleLogout} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.5rem 1rem' }}>
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
