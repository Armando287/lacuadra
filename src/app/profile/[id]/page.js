"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import Preloader from '@/components/Preloader';
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
  const [activeTab, setActiveTab] = useState('muro'); 
  
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const fileInputRef = useRef(null);

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
    const toastId = toast.loading('Procesando solicitud...');
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
        toast.success(
          action === 'add' ? 'Solicitud enviada' : 
          action === 'accept' ? 'Amigo añadido' : 'Solicitud rechazada',
          { id: toastId }
        );
        fetchData();
      } else {
        toast.error(`Error: ${data.error}`, { id: toastId });
      }
    } catch (error) {
      console.error("Error managing friend:", error);
      toast.error('Ocurrió un error inesperado', { id: toastId });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 50MB');
      e.target.value = '';
      return;
    }
    setMediaFile(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !mediaFile) return;
    
    const toastId = toast.loading('Publicando en tu muro...');
    setPosting(true);
    
    try {
      let media_url = null;
      let media_type = null;

      // 1. Upload media if exists
      if (mediaFile) {
        toast.loading('Subiendo archivo...', { id: toastId });
        const formData = new FormData();
        formData.append('file', mediaFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (!uploadData.success) {
          throw new Error(`Error al subir: ${uploadData.error}`);
        }
        
        media_url = uploadData.url;
        media_type = uploadData.contentType;
      }

      // 2. Create Post
      toast.loading('Guardando post...', { id: toastId });
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: currentUserId, 
          content: newPostContent,
          media_url,
          media_type
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setNewPostContent('');
        setMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setPosts([data.post, ...posts]);
        toast.success('¡Publicado con éxito!', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al publicar', { id: toastId });
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres eliminar esta publicación? Esto también borrará la imagen/video de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff4444',
      cancelButtonColor: '#333',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#1a1a24',
      color: '#fff'
    });

    if (!result.isConfirmed) return;

    const toastId = toast.loading('Eliminando...');
    try {
      const res = await fetch(`/api/posts/${postId}?user_id=${currentUserId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter(p => p.id !== postId));
        toast.success('Publicación eliminada', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
    setMenuOpenId(null);
  };

  const handleEditPost = async (postId) => {
    if (!editContent.trim()) return;
    const toastId = toast.loading('Guardando cambios...');
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, content: editContent })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p));
        toast.success('Publicación actualizada', { id: toastId });
        setEditingPostId(null);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  if (loading) return <Preloader text="CARGANDO PERFIL..." />;
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
                
                {mediaFile && (
                  <div style={{ padding: '10px 10px 10px 60px', color: 'var(--accent)', fontSize: '0.9rem' }}>
                    📎 Archivo adjunto: {mediaFile.name}
                  </div>
                )}

                <div className={styles.createPostActions}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', fontSize: '0.9rem', marginRight: 'auto' }}>
                    <span>📎 Foto/Video</span>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </label>

                  <button type="submit" className="btn-primary" disabled={posting || (!newPostContent.trim() && !mediaFile)}>
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
                      <img src={post.user?.avatar_url || '/logo.png'} className={styles.smallAvatar} />
                      <div className={styles.postMeta}>
                        <span className={styles.postAuthor}>{post.user?.username || 'Usuario'}</span>
                        <span className={styles.postDate}>{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                      
                      {post.user_id == currentUserId && (
                        <div style={{ marginLeft: 'auto', position: 'relative' }}>
                          <button 
                            style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}
                            onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                          >
                            ⋮
                          </button>
                          {menuOpenId === post.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1a1a24', border: '1px solid #333', borderRadius: '8px', zIndex: 10, minWidth: '120px', overflow: 'hidden' }}>
                              <button 
                                style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditContent(post.content || '');
                                  setMenuOpenId(null);
                                }}
                              >
                                Editar
                              </button>
                              <button 
                                style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#ff4444', textAlign: 'left', cursor: 'pointer' }}
                                onClick={() => handleDeletePost(post.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingPostId === post.id ? (
                      <div className={styles.postContent} style={{ marginBottom: post.media_url ? '1rem' : '0' }}>
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={styles.postInput}
                          style={{ minHeight: '80px', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" onClick={() => setEditingPostId(null)}>Cancelar</button>
                          <button className="btn-primary" onClick={() => handleEditPost(post.id)}>Guardar</button>
                        </div>
                      </div>
                    ) : (
                      post.content && (
                        <div className={styles.postContent} style={{ marginBottom: post.media_url ? '1rem' : '0' }}>
                          {post.content}
                        </div>
                      )
                    )}

                    {post.media_url && (
                      <div className={styles.postMediaContainer}>
                        {post.media_type?.startsWith('video/') ? (
                          <video 
                            src={post.media_url} 
                            controls 
                            className={styles.postMedia}
                            preload="none"
                          />
                        ) : (
                          <img src={post.media_url} className={styles.postMedia} alt="Post media" loading="lazy" />
                        )}
                      </div>
                    )}
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
