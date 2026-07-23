"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Preloader from '@/components/Preloader';
import styles from './edit.module.css';

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  // Profile Form States
  const [username, setUsername] = useState('');
  const [favoriteClub, setFavoriteClub] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
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

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // Solo comprimimos imágenes
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Reducir tamaño si es más grande de 1200px de ancho o alto
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob || blob.size < 100) {
              return reject(new Error("Blob is empty, compression failed"));
            }
            // Ensure filename ends with .jpg so backend detects content-type correctly
            const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const newFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          }, 'image/jpeg', 0.8); // 80% calidad
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadFile = async (file) => {
    let compressedFile = file;
    try {
      compressedFile = await compressImage(file);
    } catch (e) {
      console.warn("No se pudo comprimir la imagen", e);
    }
    
    const formData = new FormData();
    formData.append('file', compressedFile);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed (${res.status}): ${text.substring(0, 50)}...`);
    }
    
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
      const payload = {
        id: userId,
        username,
        favorite_club: favoriteClub,
        phone,
        bio,
        avatar_url: finalAvatarUrl,
        cover_url: finalCoverUrl
      };
      
      if (currentPassword && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  if (loading) return <Preloader text="CARGANDO EDITOR..." />;

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

          <div style={{ borderTop: '1px solid #333', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>Cambiar Contraseña (Opcional)</h3>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña Actual</label>
              <input 
                type="password" 
                className={styles.input} 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                placeholder="Solo si quieres cambiarla..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nueva Contraseña</label>
              <input 
                type="password" 
                className={styles.input} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Escribe tu nueva contraseña"
              />
            </div>
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
