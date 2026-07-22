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
      <h1 className={styles.title}>Ranking Oficial</h1>
      <p className={styles.subtitle}>Los mejores pronosticadores de la temporada.</p>

      <div className={styles.tableContainer}>
        <div className={styles.list}>
          {users.map((user, index) => {
            let positionClass = '';
            let badgeClass = '';
            let badgeText = '';

            if (index === 0) {
              positionClass = styles.gold;
              badgeClass = styles.goldBadge;
              badgeText = 'Campeón';
            } else if (index === 1) {
              positionClass = styles.silver;
              badgeClass = styles.silverBadge;
              badgeText = 'Plata';
            } else if (index === 2) {
              positionClass = styles.bronze;
              badgeClass = styles.bronzeBadge;
              badgeText = 'Bronce';
            }

            return (
              <div key={user.id} className={`${styles.row} ${index < 3 ? styles.topRow : ''}`}>
                <div className={styles.leftCol}>
                  <span className={`${styles.position} ${positionClass}`}>
                    {index + 1}
                  </span>
                  <div className={styles.userCell}>
                    <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                    <span className={styles.username}>{user.username}</span>
                  </div>
                </div>
                
                <div className={styles.rightCol}>
                  {badgeText && (
                    <span className={`${styles.badge} ${badgeClass}`}>
                      {badgeText}
                    </span>
                  )}
                  <span className={styles.points}>{user.points} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
