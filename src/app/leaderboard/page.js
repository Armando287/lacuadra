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
          <div key={user.id} className={styles.row}>
            <div className={styles.userCell}>
              <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
              <span className={styles.username}>{user.username}</span>
            </div>
            
            <div className={styles.clubCell}>
              {user.club ? user.club : '-'}
            </div>

            <div className={styles.pointsCell}>
              {user.points}
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
            <div key={user.id} className={styles.row}>
              <div className={styles.userCell}>
                <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                <span className={styles.username}>{user.username}</span>
              </div>
              
              <div className={styles.clubCell}>
                 {user.isWinner ? 'GANADOR (+5)' : '-'}
              </div>

              <div className={styles.pointsCell}>
                {user.points}
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
        <div key={fan.club} className={styles.row}>
          <div className={styles.userCell}>
            <span className={styles.username}>{fan.club}</span>
          </div>
          
          <div className={styles.clubCell}>
             {index === 0 ? 'LÍDER' : '-'}
          </div>

          <div className={styles.pointsCell}>
            {fan.points}
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
