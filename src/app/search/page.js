"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './search.module.css';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loggedInId = localStorage.getItem('user_token');
    setCurrentUserId(loggedInId);
    if (q) {
      fetchUsers(q);
    } else {
      setLoading(false);
    }
  }, [q]);

  const fetchUsers = async (query) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Resultados para "{q}"</h1>
      {loading ? (
        <p>Buscando...</p>
      ) : users.length > 0 ? (
        <div className={styles.userGrid}>
          {users.map(user => (
            <Link href={`/profile/${user.id}`} key={user.id} className={styles.userRow}>
              <img src={user.avatar_url || '/logo.png'} alt={user.username} className={styles.avatar} />
              <div className={styles.userInfo}>
                <h3>{user.username}</h3>
                {user.bio && <p className={styles.bio}>{user.bio.substring(0, 50)}...</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.noResults}>No se encontraron usuarios con ese nombre.</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<div>Cargando...</div>}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
