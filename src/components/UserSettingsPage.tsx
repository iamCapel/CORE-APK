import React, { useState, useEffect } from 'react';
import { updateUser, getUserById } from '../services/firebaseUserStorage';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import './UserSettingsPage.css';

interface User {
  id?: string;
  username: string;
  name: string;
  email?: string;
  profilePhoto?: string;
  role?: string;
}

interface UserSettingsPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

// SVG Icons
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const tabs = [
  { id: "perfil", label: "Perfil", icon: UserIcon },
  { id: "correo", label: "Correo", icon: MailIcon },
  { id: "contrasena", label: "Contraseña", icon: LockIcon },
];

const UserSettingsPage: React.FC<UserSettingsPageProps> = ({ user, onBack, onLogout }) => {
  // Estados para los campos editables
  const [fullName, setFullName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeSection, setActiveSection] = useState<'perfil' | 'correo' | 'contrasena' | null>(null);

  useEffect(() => {
    // Cargar datos completos del usuario desde Firebase
    if (user.id) {
      getUserById(user.id).then(userData => {
        if (userData) {
          setFullName(userData.name);
          setUsername(userData.username);
          setEmail(userData.email);
        }
      });
    }
  }, [user.id]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      showMessage('El nombre completo no puede estar vacío', 'error');
      return;
    }

    setLoading(true);
    try {
      const userId = user.id || auth.currentUser?.uid;
      if (!userId) {
        showMessage('No se pudo identificar al usuario', 'error');
        return;
      }

      const result = await updateUser(userId, {
        name: fullName.trim(),
        username: username.trim()
      });

      if (result.success) {
        showMessage('✅ Perfil actualizado correctamente', 'success');
      } else {
        showMessage(`❌ Error: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showMessage(`❌ Error al actualizar perfil: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      showMessage('El correo electrónico no puede estar vacío', 'error');
      return;
    }

    if (!currentPassword) {
      showMessage('Debe ingresar su contraseña actual para cambiar el correo', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Correo electrónico no válido', 'error');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showMessage('No hay sesión activa', 'error');
        return;
      }

      // Reautenticar usuario antes de cambiar email
      const credential = EmailAuthProvider.credential(
        currentUser.email || user.email || '',
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Actualizar email en Firebase Auth
      await updateEmail(currentUser, email.trim());

      // Actualizar email en Firestore
      const userId = user.id || currentUser.uid;
      await updateUser(userId, { email: email.trim() });

      showMessage('✅ Correo electrónico actualizado correctamente', 'success');
      setCurrentPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        showMessage('❌ Contraseña incorrecta', 'error');
      } else if (error.code === 'auth/email-already-in-use') {
        showMessage('❌ Este correo ya está en uso', 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showMessage('❌ Por seguridad, debe cerrar sesión y volver a iniciar', 'error');
      } else {
        showMessage(`❌ Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showMessage('Debe ingresar su contraseña actual', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showMessage('No hay sesión activa', 'error');
        return;
      }

      // Reautenticar usuario antes de cambiar contraseña
      const credential = EmailAuthProvider.credential(
        currentUser.email || user.email || '',
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Actualizar contraseña
      await updatePassword(currentUser, newPassword);

      showMessage('✅ Contraseña actualizada correctamente', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        showMessage('❌ Contraseña actual incorrecta', 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        showMessage('❌ Por seguridad, debe cerrar sesión y volver a iniciar', 'error');
      } else {
        showMessage(`❌ Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* TOPBAR */}
      <div className="topbar">
        <button className="back-btn" onClick={onBack} title="Volver">
          <BackIcon />
        </button>
        <div className="topbar-title">Configuración</div>
        <div className="topbar-spacer" />
      </div>

      {/* AVATAR HERO */}
      <div className="hero">
        <div className="avatar-ring">
          <div className="avatar-inner">
            {fullName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || 'U'}
          </div>
          <div className="avatar-edit-btn"><EditIcon /></div>
        </div>
        <div className="hero-name">{fullName}</div>
        <div className="hero-handle">@{username}</div>
        <div className="hero-badge">MOPC · Sistema de Reportes</div>
      </div>

      {/* Mensaje de notificación flotante */}
      {message && (
        <div className={`notification-toast ${messageType}`}>
          {message}
        </div>
      )}

      {/* GROUP — CUENTA */}
      <div className="section">
        <div className="section-label">Cuenta</div>
        <div className="section-group">
          <div className="row" onClick={() => setActiveSection('perfil')}>
            <div className="row-icon"><UserIcon /></div>
            <div className="row-text">
              <div className="row-label">Perfil</div>
              <div className="row-value">{fullName} · @{username}</div>
            </div>
            <div className="row-end"><span className="chevron"><ChevronIcon /></span></div>
          </div>

          <div className="row" onClick={() => setActiveSection('correo')}>
            <div className="row-icon"><MailIcon /></div>
            <div className="row-text">
              <div className="row-label">Correo electrónico</div>
              <div className="row-value">{email || 'No configurado'}</div>
            </div>
            <div className="row-end"><span className="chevron"><ChevronIcon /></span></div>
          </div>

          <div className="row" onClick={() => setActiveSection('contrasena')}>
            <div className="row-icon"><LockIcon /></div>
            <div className="row-text">
              <div className="row-label">Contraseña</div>
              <div className="row-value">••••••••</div>
            </div>
            <div className="row-end"><span className="chevron"><ChevronIcon /></span></div>
          </div>
        </div>
      </div>

      {/* GROUP — SESIÓN */}
      <div className="section">
        <div className="section-label">Sesión</div>
        <div className="section-group">
          <div className="row" onClick={onLogout}>
            <div className="row-icon danger"><LogoutIcon /></div>
            <div className="row-text">
              <div className="row-label danger">Cerrar sesión</div>
              <div className="row-value">Salir de esta cuenta</div>
            </div>
            <div className="row-end"><span className="chevron"><ChevronIcon /></span></div>
          </div>
        </div>
      </div>

      {/* DRAWER — Perfil */}
      <Drawer open={activeSection === "perfil"} title="Editar Perfil" onClose={() => setActiveSection(null)}>
        <div>
          <label className="field-label">Nombre Completo</label>
          <input 
            className="field-input" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            placeholder="Tu nombre completo"
          />
        </div>
        <div>
          <label className="field-label">Nombre de Usuario</label>
          <input 
            className="field-input" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            placeholder="usuario"
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            handleUpdateProfile();
            setActiveSection(null);
          }}
          disabled={loading}
        >
          <SaveIcon /> {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </Drawer>

      {/* DRAWER — Correo */}
      <Drawer open={activeSection === "correo"} title="Correo Electrónico" onClose={() => setActiveSection(null)}>
        <div>
          <label className="field-label">Nuevo Correo Electrónico</label>
          <input 
            className="field-input" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div>
          <label className="field-label">Contraseña Actual</label>
          <input 
            className="field-input" 
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <small style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
            Por seguridad, confirme su contraseña
          </small>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            handleUpdateEmail();
          }}
          disabled={loading}
        >
          <SaveIcon /> {loading ? 'Actualizando...' : 'Actualizar Correo'}
        </button>
      </Drawer>

      {/* DRAWER — Contraseña */}
      <Drawer open={activeSection === "contrasena"} title="Cambiar Contraseña" onClose={() => setActiveSection(null)}>
        <div>
          <label className="field-label">Contraseña Actual</label>
          <input 
            className="field-input" 
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="field-label">Nueva Contraseña</label>
          <input 
            className="field-input" 
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="field-label">Confirmar Contraseña</label>
          <input 
            className="field-input" 
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          <small style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
            Mínimo 6 caracteres
          </small>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            handleUpdatePassword();
          }}
          disabled={loading}
        >
          <SaveIcon /> {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </button>
      </Drawer>
    </div>
  );
};

// Drawer Component
interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Drawer({ open, title, onClose, children }: DrawerProps) {
  return (
    <>
      <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-title">{title}</span>
          <button className="drawer-close" onClick={onClose}><XIcon /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

export default UserSettingsPage;
