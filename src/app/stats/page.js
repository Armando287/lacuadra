"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Preloader from '@/components/Preloader';
import styles from './stats.module.css';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('promedios');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Preloader text="CARGANDO ESTADÍSTICAS..." />;
  }

  if (!stats) {
    return <div className={styles.error}>No se pudieron cargar las estadísticas.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Estadísticas Oficiales</h1>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'promedios' ? styles.active : ''}`}
            onClick={() => setActiveTab('promedios')}
          >
            Tabla de Promedios
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'goleadores' ? styles.active : ''}`}
            onClick={() => setActiveTab('goleadores')}
          >
            Goleadores
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'asistencias' ? styles.active : ''}`}
            onClick={() => setActiveTab('asistencias')}
          >
            Asistencias
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'promedios' && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>Pts</th>
                    <th>PJ</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promedios.map((item, idx) => (
                    <tr key={idx} className={idx >= stats.promedios.length - 2 ? styles.relegation : ''}>
                      <td>{idx + 1}</td>
                      <td className={styles.teamCell}>
                        {item.logo && <img src={item.logo} alt={item.equipo} className={styles.logo} />}
                        {item.equipo}
                      </td>
                      <td>{item.puntos}</td>
                      <td>{item.partidos}</td>
                      <td><strong>{item.promedio.toFixed(3)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'goleadores' && (
            <div className={styles.listWrapper}>
              {stats.goleadores.map((item, idx) => (
                <div key={idx} className={styles.listItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  {item.logo && <img src={item.logo} alt={item.equipo} className={styles.listLogo} />}
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>{item.jugador}</div>
                    <div className={styles.playerTeam}>{item.equipo}</div>
                  </div>
                  <div className={styles.statValue}>
                    <span>{item.goles}</span> goles
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'asistencias' && (
            <div className={styles.listWrapper}>
              {stats.asistencias.map((item, idx) => (
                <div key={idx} className={styles.listItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  {item.logo && <img src={item.logo} alt={item.equipo} className={styles.listLogo} />}
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>{item.jugador}</div>
                    <div className={styles.playerTeam}>{item.equipo}</div>
                  </div>
                  <div className={styles.statValue}>
                    <span>{item.asistencias}</span> asis.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
