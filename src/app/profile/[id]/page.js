"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';

export default function PublicProfile({ params }) {
  const profileId = params.id;
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [profile, setProfile] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInId = localStorage.getItem('user_token');
    setCurrentUserId(loggedInId);
    fetchData();
  }, [profileId]);

  const fetchData = async () => {
    try {
      const [profileRes, friendsRes] = await Promise.all([
        fetch(`/api/users/profile?id=${profileId}`),
        fetch(`/api/friends?userId=${profileId}`)
      ]);
      
      const profileData = await profileRes.json();
      const friendsData = await friendsRes.json();

      if (profileData.success) setProfile(profileData.user);
      if (friendsData.success) setFriendships(friendsData.friendships);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendAction = async (action, requestData = null) => {
    try {
      let url = '/api/friends';
      let method = 'POST';
      let body = {};

      if (action === 'add') {
        body = { requester_id: currentUserId, receiver_id: profileId };
      } else if (action === 'accept' || action === 'reject') {
        method = 'PATCH';
        body = { id: requestData.id, status: action === 'accept' ? 'accepted' : 'rejected' };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error managing friend:", error);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Cargando Perfil...</div>;
  if (!profile) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Usuario no encontrado.</div>;

  const isOwnProfile = currentUserId == profileId;

  // Determine friendship status
  let friendStatus = 'none'; // none, pending_sent, pending_received, accepted
  let activeRequest = null;

  if (!isOwnProfile && currentUserId) {
    activeRequest = friendships.find(f => 
      (f.requester_id == currentUserId && f.receiver_id == profileId) || 
      (f.requester_id == profileId && f.receiver_id == currentUserId)
    );

    if (activeRequest) {
      if (activeRequest.status === 'accepted') {
        friendStatus = 'accepted';
      } else if (activeRequest.requester_id == currentUserId) {
        friendStatus = 'pending_sent';
      } else {
        friendStatus = 'pending_received';
      }
    }
  }

  // Filter accepted friends
  const acceptedFriends = friendships.filter(f => f.status === 'accepted');

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        
        {/* Cover Header */}
        <div 
          className={styles.cover} 
          style={{ backgroundImage: `url(${profile.cover_url || '/hero-bg.jpg'})` }}
        >
          <div className={styles.coverOverlay}></div>
        </div>

        {/* Profile Info Section */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img src={profile.avatar_url || '/logo.png'} alt={profile.username} className={styles.avatar} />
          </div>
          
          <div className={styles.headerDetails}>
            <h1 className={styles.username}>{profile.username}</h1>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          </div>

          <div className={styles.actions}>
            {isOwnProfile ? (
              <Link href="/profile/edit" className="btn-secondary">Editar Perfil</Link>
            ) : currentUserId ? (
              <>
                {friendStatus === 'none' && (
                  <button className="btn-primary" onClick={() => handleFriendAction('add')}>Añadir Amigo</button>
                )}
                {friendStatus === 'pending_sent' && (
                  <button className="btn-secondary" disabled>Solicitud Enviada</button>
                )}
                {friendStatus === 'pending_received' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={() => handleFriendAction('accept', activeRequest)}>Aceptar</button>
                    <button className="btn-secondary" onClick={() => handleFriendAction('reject', activeRequest)}>Rechazar</button>
                  </div>
                )}
                {friendStatus === 'accepted' && (
                  <button className="btn-secondary" onClick={() => handleFriendAction('reject', activeRequest)}>Amigos ✓</button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={`glass-panel ${styles.statCard}`}>
            <span className={styles.statValue}>{profile.points || 0}</span>
            <span className={styles.statLabel}>Puntos Totales</span>
          </div>
          <div className={`glass-panel ${styles.statCard}`}>
            <span className={styles.statValue}>{profile.correct_predictions || 0}</span>
            <span className={styles.statLabel}>Aciertos</span>
          </div>
          <div className={`glass-panel ${styles.statCard}`}>
            <span className={styles.statValue}>{profile.tournaments_won || 0}</span>
            <span className={styles.statLabel}>Torneos Ganados</span>
          </div>
          {isOwnProfile && profile.phone && (
            <div className={`glass-panel ${styles.statCard}`}>
              <span className={styles.statValue}>{profile.phone}</span>
              <span className={styles.statLabel}>Teléfono</span>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className={styles.friendsSection}>
          <h2 className={styles.sectionTitle}>Amigos ({acceptedFriends.length})</h2>
          {acceptedFriends.length > 0 ? (
            <div className={styles.friendsGrid}>
              {acceptedFriends.map(f => {
                const friend = f.requester_id == profileId ? f.receiver : f.requester;
                return (
                  <Link href={`/profile/${friend.id}`} key={f.id} className={`glass-panel ${styles.friendCard}`}>
                    <img src={friend.avatar_url || '/logo.png'} alt={friend.username} className={styles.friendAvatar} />
                    <span className={styles.friendName}>{friend.username}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className={styles.noFriends}>Aún no hay amigos en esta lista.</p>
          )}
        </div>

      </div>
    </main>
  );
}
