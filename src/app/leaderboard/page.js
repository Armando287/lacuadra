"use client";

import { useEffect, useState } from 'react';
import styles from './leaderboard.module.css';

export default function Leaderboard() {
  const [data, setData] = useState({ general: [], fans: [], rounds: {} });
  const [activeTab, setActiveTab] = useState('general'); // general, rounds, fans
  const [selectedRound, setSelectedRound] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.rounds && Object.keys(d.rounds).length > 0) {
          setSelectedRound(Object.keys(d.rounds)[0]);
        }
      });
  }, []);

  const renderGeneral = () => (
    <div className={styles.list}>
      {data.general.map((user, index) => {
        let positionClass = '';
        let badgeClass = '';
        let badgeText = '';

        if (index === 0) { positionClass = styles.gold; badgeClass = styles.goldBadge; badgeText = '1º'; }
        else if (index === 1) { positionClass = styles.silver; badgeClass = styles.silverBadge; badgeText = '2º'; }
        else if (index === 2) { positionClass = styles.bronze; badgeClass = styles.bronzeBadge; badgeText = '3º'; }

        return (
          <div key={user.id} className={`${styles.row} ${index < 3 ? styles.topRow : ''}`}>
            <div className={styles.leftCol}>
              <span className={`${styles.position} ${positionClass}`}>{index + 1}</span>
              <div className={styles.userCell}>
                <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                <div>
                  <span className={styles.username}>{user.username}</span>
                  {user.club && <div className={styles.clubName}>{user.club}</div>}
                </div>
              </div>
            </div>
            
            <div className={styles.statsCol}>
              <div className={styles.statItem}>
                <span>Fechas Ganadas</span>
                <strong>{user.roundWins}</strong>
              </div>
              <div className={styles.statItem}>
                <span>Resultados Exactos</span>
                <strong>{user.exactHits}</strong>
              </div>
            </div>

            <div className={styles.rightCol}>
              {badgeText && <span className={`${styles.badge} ${badgeClass}`}>{badgeText}</span>}
              <span className={styles.points}>{user.points} <small>pts</small></span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderRounds = () => {
    const roundList = Object.keys(data.rounds);
    if (roundList.length === 0) return <div className={styles.empty}>No hay datos aún.</div>;
    const users = data.rounds[selectedRound] || [];

    return (
      <div>
        <div className={styles.roundSelector}>
          <label>Seleccionar Fecha:</label>
          <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)}>
            {roundList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className={styles.list}>
          {users.map((user, index) => (
            <div key={user.id} className={`${styles.row} ${user.isWinner ? styles.topRow : ''}`}>
              <div className={styles.leftCol}>
                <span className={styles.position}>{index + 1}</span>
                <div className={styles.userCell}>
                  <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                  <span className={styles.username}>{user.username}</span>
                </div>
              </div>
              <div className={styles.rightCol}>
                {user.isWinner && <span className={`${styles.badge} ${styles.goldBadge}`}>GANADOR (+5)</span>}
                <span className={styles.points}>{user.points} <small>pts</small></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFans = () => (
    <div className={styles.list}>
      {data.fans.map((fan, index) => (
        <div key={fan.club} className={`${styles.row} ${index === 0 ? styles.topRow : ''}`}>
          <div className={styles.leftCol}>
            <span className={`${styles.position} ${index === 0 ? styles.gold : ''}`}>{index + 1}</span>
            <div className={styles.userCell}>
              <span className={styles.username}>{fan.club}</span>
            </div>
          </div>
          <div className={styles.rightCol}>
            {index === 0 && <span className={`${styles.badge} ${styles.goldBadge}`}>LÍDER</span>}
            <span className={styles.points}>{fan.points} <small>pts</small></span>
          </div>
        </div>
      ))}
      {data.fans.length === 0 && <div className={styles.empty}>Aún no hay hinchadas registradas.</div>}
    </div>
  );

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Ranking Oficial</h1>
      <p className={styles.subtitle}>Demostrá que sos el que más sabe.</p>

      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'general' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Ranking General
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'rounds' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('rounds')}
        >
          Por Fechas
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'fans' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('fans')}
        >
          Batalla Hinchadas
        </button>
      </div>

      <div className={styles.tableContainer}>
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'rounds' && renderRounds()}
        {activeTab === 'fans' && renderFans()}
      </div>
    </main>
  );
}
