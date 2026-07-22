"use client";

import { useEffect, useState } from 'react';
import styles from './leaderboard.module.css';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setUsers(data.leaderboard));
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>🏆 Ranking Oficial</h1>
      <p className={styles.subtitle}>Los mejores pronosticadores de La Cuadra.</p>

      <div className={`glass-panel ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Usuario</th>
              <th>Puntos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className={index < 2 ? styles.topRow : ''}>
                <td>
                  <span className={`${styles.position} ${index === 0 ? styles.gold : index === 1 ? styles.silver : ''}`}>
                    {index + 1}
                  </span>
                </td>
                <td>
                  <div className={styles.userCell}>
                    <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                    <span>{user.username}</span>
                  </div>
                </td>
                <td className={styles.points}>{user.points}</td>
                <td>
                  {index === 0 && <span className={styles.badge}>🏆 Campeón</span>}
                  {index === 1 && <span className={styles.badge}>🥈 Subcampeón</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
