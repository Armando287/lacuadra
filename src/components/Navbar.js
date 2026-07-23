"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import Swal from 'sweetalert2';

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  
  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const unreadCount = notifications.filter(n => !n.is_read).length + friendRequests.length;

  useEffect(() => {
    const name = localStorage.getItem('user_name');
    const id = localStorage.getItem('user_token');
    if (name) {
      setUsername(name);
    }
    if (id) {
      setUserId(id);
      fetchNotifications(id);
    }
    const adminFlag = localStorage.getItem('user_is_admin');
    if (adminFlag === 'true') {
      setIsAdmin(true);
    }
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const fetchNotifications = async (id) => {
    try {
      const [notifRes, friendRes] = await Promise.all([
        fetch(`/api/notifications?userId=${id}`),
        fetch(`/api/friends?userId=${id}`)
      ]);
      const notifData = await notifRes.json();
      const friendData = await friendRes.json();

      if (notifData.success) {
        setNotifications(notifData.notifications);
      }
      if (friendData.success) {
        const pending = friendData.friendships.filter(f => f.receiver_id == id && f.status === 'pending');
        setFriendRequests(pending);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFriendAction = async (requestId, action) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: action })
      });
      const data = await res.json();
      if (data.success) {
        setFriendRequests(friendRequests.filter(f => f.id !== requestId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) return;
    
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationIds: unread })
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      markAsRead();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
    setUsername(null);
    setUserId(null);
    setIsAdmin(false);
    window.location.reload();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">
            <img src="/logo.png" alt="La Cuadra" style={{ height: '40px', width: 'auto' }} />
          </Link>
        </div>
        
        {/* Hamburger Icon for Mobile */}
        <button className={styles.hamburger} onClick={toggleMenu}>
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></span>
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`}></span>
        </button>

        <div className={`${styles.links} ${menuOpen ? styles.mobileOpen : ''}`}>
          {isAdmin && (
            <Link href="/admin" className={`${styles.link} ${pathname === '/admin' ? styles.active : ''}`} style={{ color: 'var(--accent)' }}>
              👑 Admin Panel
            </Link>
          )}
          <Link href="/matches" className={`${styles.link} ${pathname === '/matches' ? styles.active : ''}`}>
            Partidos
          </Link>
          <Link href="/leaderboard" className={`${styles.link} ${pathname === '/leaderboard' ? styles.active : ''}`}>
            Ranking
          </Link>
          <Link href="/rules" className={`${styles.link} ${pathname === '/rules' ? styles.active : ''}`}>
            Reglas
          </Link>
          
          <form className={styles.searchForm} onSubmit={(e) => {
            e.preventDefault();
            const q = e.target.search.value;
            if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }}>
            <input 
              type="text" 
              name="search" 
              placeholder="🔍 Buscar amigos..." 
              className={styles.searchInput}
            />
          </form>
          {username ? (
            <div className={styles.authGroup}>
              <div className={styles.notificationWrapper}>
                <button className={styles.bellBtn} onClick={toggleNotifications}>
                  🔔
                  {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </button>
                {notificationsOpen && (
                  <div className={styles.notificationDropdown}>
                    <h3 className={styles.dropdownTitle}>Notificaciones</h3>
                    <div className={styles.dropdownContent}>
                      {friendRequests.length === 0 && notifications.length === 0 && (
                        <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tienes notificaciones</p>
                      )}
                      
                      {friendRequests.map(req => (
                        <div key={req.id} className={styles.notificationItem}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={req.requester?.avatar_url || '/logo.png'} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                            <span><strong>{req.requester?.username}</strong> te envió una solicitud</span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleFriendAction(req.id, 'accepted')}>Aceptar</button>
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleFriendAction(req.id, 'rejected')}>Rechazar</button>
                          </div>
                        </div>
                      ))}

                      {notifications.map(notif => (
                        <div key={notif.id} className={styles.notificationItem} style={{ opacity: notif.is_read ? 0.7 : 1 }}>
                          <strong>{notif.title}</strong>
                          <p style={{ fontSize: '0.85rem', margin: '5px 0 0 0', color: 'var(--text-muted)' }}>{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href={`/profile/${userId}`} style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }} className={styles.profileLink}>
                👤 {username}
              </Link>
              <button onClick={handleLogout} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.5rem 1rem' }}>
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
