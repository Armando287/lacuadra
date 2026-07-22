"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoText}>La Cuadra</span>
          </Link>
        </div>
        <div className={styles.links}>
          <Link href="/matches" className={pathname === '/matches' ? styles.active : ''}>
            Partidos
          </Link>
          <Link href="/leaderboard" className={pathname === '/leaderboard' ? styles.active : ''}>
            Ranking
          </Link>
          <Link href="/rules" className={pathname === '/rules' ? styles.active : ''}>
            Reglas
          </Link>
          <Link href="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
