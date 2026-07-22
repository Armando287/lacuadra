"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={`glass-panel ${styles.navbar}`}>
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
        <Link href="/login" className="btn-primary">
          Login
        </Link>
      </div>
    </nav>
  );
}
