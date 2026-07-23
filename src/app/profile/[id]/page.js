"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './profile.module.css';

export default function PublicProfile() {
  const params = useParams();
  const profileId = params.id;
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [profile, setProfile] = useState(null);
  const [friendships, setFriendships] = useState([]);
  const [posts, setPosts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState("");
  const [activeTab, setActiveTab] = useState('muro'); // muro, amigos, info
  
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const loggedInId = localStorage.getItem('user_token');
    setCurrentUserId(loggedInId);
    if (profileId) {
      fetchData();
    }
  }, [profileId]);

  const fetchData = async () => {
    try {
      const [profileRes, friendsRes, postsRes] = await Promise.all([
        fetch(`/api/users/profile?id=${profileId}`),
        fetch(`/api/friends?userId=${profileId}`),
        fetch(`/api/posts?userId=${profileId}`)
      ]);
      
      const profileData = await profileRes.json();
      const friendsData = await friendsRes.json();
      const postsData = await postsRes.json();

      if (profileData.success) {
        setProfile(profileData.user);
      } else {
        setDebugMsg(`Profile API Error: ${profileData.error}`);
      }
      
      if (friendsData.success) {
        setFriendships(friendsData.friendships);
      }
      if (postsData.success) {
        setPosts(postsData.posts);
      }
      
    } catch (error) {
      console.error(error);
      setDebugMsg(`Fetch Error: ${error.message}`);
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, content: newPostContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewPostContent('');
        setPosts([data.post, ...posts]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Cargando Perfil...</div>;
  if (!profile) return (
    <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>
      <h2>Usuario no encontrado.</h2>
      <p style={{ color: '#ff4444', marginTop: '1rem' }}>{debugMsg}</p>
    </div>
  );

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

  const acceptedFriends = friendships.filter(f => f.status === 'accepted');

  return (
    <main className={styles.main}>
      {/* FACEBOOK STYLE HEADER */}
      <div className={styles.headerContainer}>
        <div 
          className={styles.cover} 
          style={{ backgroundImage: `url(${profile.cover_url || '/hero-bg.jpg'})` }}
        ></div>
        
        <div className={styles.headerContent}>
          <div className={styles.avatarWrapper}>
            <img src={profile.avatar_url || '/logo.png'} alt={profile.username} className={styles.avatar} />
          </div>
          
          <div className={styles.headerInfo}>
            <div>
              <h1 className={styles.username}>{profile.username}</h1>
              <p className={styles.friendCount}>{acceptedFriends.length} Amigos</p>
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
        </div>
        
        <div className={styles.tabsDivider}></div>
        
        <div className={styles.tabsContainer}>
          <button className={`${styles.tab} ${activeTab === 'muro' ? styles.activeTab : ''}`} onClick={() => setActiveTab('muro')}>Posts</button>
          <button className={`${styles.tab} ${activeTab === 'amigos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('amigos')}>Amigos</button>
          <button className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`} onClick={() => setActiveTab('info')}>Información</button>
        </div>
      </div>

      <div className={styles.bodyContainer}>
        {/* TAB MURO */}
        {activeTab === 'muro' && (
          <div className={styles.muroContainer}>
            {/* Create Post Box */}
            {isOwnProfile && (
              <form className={`glass-panel ${styles.createPostBox}`} onSubmit={handleCreatePost}>
                <div className={styles.createPostInputWrapper}>
                  <img src={profile.avatar_url || '/logo.png'} className={styles.smallAvatar} />
                  <textarea 
                    placeholder="¿Qué estás pensando?" 
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    className={styles.postInput}
                  />
                </div>
                <div className={styles.createPostActions}>
                  <button type="submit" className="btn-primary" disabled={posting || !newPostContent.trim()}>
                    {posting ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            )}

            {/* Posts Feed */}
            <div className={styles.feed}>
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className={`glass-panel ${styles.postCard}`}>
                    <div className={styles.postHeader}>
                      <img src={post.user.avatar_url || '/logo.png'} className={styles.smallAvatar} />
                      <div className={styles.postMeta}>
                        <span className={styles.postAuthor}>{post.user.username}</span>
                        <span className={styles.postDate}>{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={styles.postContent}>
                      {post.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`glass-panel ${styles.noPosts}`}>
                  Aún no hay publicaciones en este muro.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB AMIGOS */}
        {activeTab === 'amigos' && (
          <div className={`glass-panel ${styles.friendsSection}`}>
            <h2 className={styles.sectionTitle}>Amigos ({acceptedFriends.length})</h2>
            {acceptedFriends.length > 0 ? (
              <div className={styles.friendsGrid}>
                {acceptedFriends.map(f => {
                  const friend = f.requester_id == profileId ? f.receiver : f.requester;
                  return (
                    <Link href={`/profile/${friend.id}`} key={f.id} className={styles.friendCard}>
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
        )}

        {/* TAB INFORMACIÓN */}
        {activeTab === 'info' && (
          <div className={styles.infoGrid}>
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
            {profile.phone && (
              <div className={`glass-panel ${styles.statCard}`}>
                <span className={styles.statValue}>{profile.phone}</span>
                <span className={styles.statLabel}>Teléfono</span>
              </div>
            )}
            {profile.bio && (
              <div className={`glass-panel ${styles.bioCard}`} style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Biografía</h3>
                <p>{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
