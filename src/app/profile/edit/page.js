"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './edit.module.css';

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  // Profile Form States
  const [username, setUsername] = useState('');
  const [favoriteClub, setFavoriteClub] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  
  // Upload States
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('user_token');
    if (!id) {
      router.push('/login');
      return;
    }
    setUserId(id);
    fetchProfile(id);
  }, []);

  const fetchProfile = async (id) => {
    try {
      const res = await fetch(`/api/users/profile?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setUsername(data.user.username || '');
        setFavoriteClub(data.user.favorite_club || '');
        setPhone(data.user.phone || '');
        setBio(data.user.bio || '');
        setAvatarPreview(data.user.avatar_url || '');
        setCoverPreview(data.user.cover_url || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(previewUrl);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (data.success) {
      return data.url;
    }
    throw new Error(data.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      let finalAvatarUrl = avatarPreview;
      let finalCoverUrl = coverPreview;

      // Upload Avatar if changed
      if (avatarFile) {
        finalAvatarUrl = await uploadFile(avatarFile);
      }
      
      // Upload Cover if changed
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile);
      }

      // Update Profile
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          username,
          favorite_club: favoriteClub,
          phone,
          bio,
          avatar_url: finalAvatarUrl,
          cover_url: finalCoverUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('✅ Perfil actualizado correctamente');
        setTimeout(() => {
          router.push(`/profile/${userId}`);
        }, 1500);
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      setMessage(`❌ Error: ${error.message || 'Ocurrió un error al guardar el perfil.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '5rem' }}>Cargando Editor...</div>;

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.container}`}>
        <h1 className={styles.title}>Editar Perfil</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.uploadSection}>
            <label className={styles.label}>Foto de Portada</label>
            <div 
              className={styles.coverPreview} 
              style={{ backgroundImage: `url(${coverPreview || '/hero-bg.jpg'})` }}
            >
              <div className={styles.uploadOverlay}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={(e) => handleFileChange(e, 'cover')}
                  className={styles.fileInput}
                />
                <span>Cambiar Portada</span>
              </div>
            </div>
          </div>

          <div className={styles.uploadSection}>
            <label className={styles.label}>Avatar</label>
            <div className={styles.avatarPreviewWrapper}>
              <img src={avatarPreview || '/logo.png'} alt="Avatar" className={styles.avatarImg} />
              <div className={styles.uploadOverlayAvatar}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className={styles.fileInput}
                />
                <span>Cambiar</span>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre de Usuario (Una vez cada 5 meses)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Tu nombre de usuario"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Club Favorito (Una vez cada 5 meses)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={favoriteClub} 
              onChange={e => setFavoriteClub(e.target.value)} 
              placeholder="¿De qué club eres?"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Teléfono (WhatsApp)</label>
            <input 
              type="tel" 
              className={styles.input} 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+595 9XX XXX XXX"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Biografía (Max 150 chars)</label>
            <textarea 
              className={styles.textarea} 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              maxLength={150}
              placeholder="Escribe algo sobre ti..."
            />
          </div>

          {message && <div className={styles.message}>{message}</div>}

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
