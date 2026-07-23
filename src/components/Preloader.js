import styles from './Preloader.module.css';

export default function Preloader({ text = 'CARGANDO...' }) {
  return (
    <div className={styles.container}>
      <div className={styles.ring}></div>
      <div className={styles.text}>{text}</div>
    </div>
  );
}
