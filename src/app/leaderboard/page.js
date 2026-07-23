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
      <div className={styles.headerRow}>
        <div className={styles.colPos}>#</div>
        <div className={styles.colUser}>Usuario</div>
        <div className={styles.colClub}>Club</div>
        <div className={styles.colStat}>Pleno</div>
        <div className={styles.colStat}>Fechas</div>
        <div className={styles.colPts}>Pts</div>
      </div>
      {data.general.map((user, index) => {
        return (
          <div key={user.id} className={styles.row}>
            <div className={styles.colPos}>{index + 1}</div>
            
            <div className={styles.colUser}>
              <img src={user.avatarUrl} alt={user.username} className={styles.avatar} />
              <span className={styles.username}>{user.username}</span>
            </div>
            
            <div className={styles.colClub}>
              {user.club ? user.club : '-'}
            </div>

            <div className={styles.colStat}>
              {user.exactHits || 0}
            </div>

            <div className={styles.colStat}>
              {user.roundWins || 0}
            </div>

            <div className={styles.colPts}>
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
