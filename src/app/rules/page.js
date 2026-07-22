"use client";

import styles from './rules.module.css';

export default function RulesPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Reglas Oficiales</h1>
      <p className={styles.subtitle}>Participá pronosticando los resultados de los partidos y demostrá que sos el que más sabe.</p>

      <div className={styles.grid}>
        <div className={`glass-panel ${styles.ruleSection}`}>
          <h2>🎯 Sistema de Puntos</h2>
          <p>Cada pronóstico otorga puntos según el resultado final del partido.</p>
          
          <div className={styles.pointCard}>
            <div className={styles.pointBadge}>10 pts</div>
            <div className={styles.pointContent}>
              <h3>Resultado Exacto</h3>
              <p>Acertás exactamente el marcador final.</p>
              <small>Ejemplo: Pronosticás 2-1 y termina 2-1.</small>
            </div>
          </div>
          
          <div className={styles.pointCard}>
            <div className={styles.pointBadge}>8 pts</div>
            <div className={styles.pointContent}>
              <h3>Ganador y Diferencia</h3>
              <p>Acertás el ganador y la diferencia de goles.</p>
              <small>Ejemplo: Pronosticás 3-1 (+2) y termina 2-0 (+2).</small>
            </div>
          </div>

          <div className={styles.pointCard}>
            <div className={styles.pointBadge}>7 pts</div>
            <div className={styles.pointContent}>
              <h3>Empate Acertado</h3>
              <p>Pronosticás un empate y el partido termina empatado con otro marcador.</p>
              <small>Ejemplo: Pronosticás 1-1 y termina 2-2.</small>
            </div>
          </div>

          <div className={styles.pointCard}>
            <div className={styles.pointBadge}>6 pts</div>
            <div className={styles.pointContent}>
              <h3>Ganador Acertado</h3>
              <p>Acertás solamente quién gana, sin la diferencia correcta.</p>
              <small>Ejemplo: Pronosticás 2-1 y termina 1-0.</small>
            </div>
          </div>

          <div className={styles.pointCard}>
            <div className={`${styles.pointBadge} ${styles.zero}`}>0 pts</div>
            <div className={styles.pointContent}>
              <h3>Resultado Incorrecto</h3>
              <p>No acertás quién gana ni empatan.</p>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={`glass-panel ${styles.ruleSection}`}>
            <h2>⏰ ¿Hasta cuándo puedo pronosticar?</h2>
            <div className={styles.infoBox}>
              <span className={styles.icon}>🔒</span>
              <p><strong>Las predicciones se cierran cuando comienza el partido.</strong> Podés modificar tu pronóstico todas las veces que quieras mientras el partido todavía no haya comenzado (estado "PRÓXIMO").</p>
            </div>
          </div>

          <div className={`glass-panel ${styles.ruleSection}`}>
            <h2>📅 Ranking por Fecha (Jornada)</h2>
            <ul className={styles.list}>
              <li>Cada jornada tiene su propia clasificación.</li>
              <li>En caso de empate en la fecha, se mira quién tuvo más resultados exactos y luego cantidad de predicciones.</li>
              <li className={styles.highlightList}>
                <strong>🏆 Bonus:</strong> El jugador que termina 1º en la fecha recibe <strong>+5 puntos</strong> para el Ranking General.
              </li>
            </ul>
          </div>

          <div className={`glass-panel ${styles.ruleSection}`}>
            <h2>🏆 Campeón y Subcampeón</h2>
            <p>Podés predecir el resultado del torneo a largo plazo.</p>
            <div className={styles.championBox}>
              <div><strong>🥇 Campeón:</strong> +10 puntos</div>
              <div><strong>🥈 Subcampeón:</strong> +8 puntos</div>
            </div>
            <p className={styles.smallNote}>⏳ La elección debe realizarse antes de terminar la Fecha 3. (Próximamente disponible en tu perfil).</p>
          </div>
        </div>
      </div>
    </main>
  );
}
