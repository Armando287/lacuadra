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
            Copa Paraguay, Apertura y Clausura. Únete y demuestra que sabes de fútbol.
          </p>
          <div className={styles.ctaContainer}>
            <a href="/login" className="btn-primary">
              Iniciar Sesión / Registro
            </a>
            <a href="/matches" className="btn-secondary">
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
          <h3><span>🏆</span> Torneos Oficiales</h3>
          <p>Compite en cada fecha del Apertura, Clausura y la emocionante Copa Paraguay.</p>
        </div>
        <div className={`glass-panel ${styles.featureCard}`}>
          <h3><span>⚡</span> Resultados en Vivo</h3>
          <p>Obtén actualizaciones y notificaciones al instante de goles, tarjetas y finales.</p>
        </div>
        <div className={`glass-panel ${styles.featureCard}`}>
          <h3><span>📊</span> Ranking Global</h3>
          <p>Suma puntos por cada predicción exacta y conviértete en el campeón absoluto.</p>
        </div>
      </div>
    </main>
  );
}
