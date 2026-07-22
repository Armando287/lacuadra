"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={`glass-panel animate-fade-in ${styles.glassContainer}`}>
          <h1 className={styles.title}>
            <span className={styles.highlight}>La Cuadra</span> PY
          </h1>
          <p className={styles.subtitle}>
            La polla definitiva para los torneos paraguayos. 
            Copa Paraguay, Apertura y Clausura.
          </p>
          <div className={styles.ctaContainer}>
            <a href="/login" className="btn-primary">
              Iniciar Sesión / Registro
            </a>
            <a href="/matches" className={styles.btnSecondary}>
              Ver Partidos
            </a>
          </div>
        </div>
        <div className={`animate-fade-in ${styles.imageContainer}`}>
          <img 
            src="/landing.png" 
            alt="La Cuadra Landing" 
            className={styles.landingImage}
          />
        </div>
      </div>
      
      <div className={styles.featuresSection}>
        <div className={`glass-panel ${styles.featureCard}`}>
          <h3>🏆 Torneos Oficiales</h3>
          <p>Apertura, Clausura y Copa Paraguay.</p>
        </div>
        <div className={`glass-panel ${styles.featureCard}`}>
          <h3>⚡ Resultados en Vivo</h3>
          <p>Notificaciones de goles, tarjetas y más al instante.</p>
        </div>
        <div className={`glass-panel ${styles.featureCard}`}>
          <h3>📊 Ranking</h3>
          <p>Suma puntos por aciertos y conviértete en el campeón.</p>
        </div>
      </div>
    </main>
  );
}
