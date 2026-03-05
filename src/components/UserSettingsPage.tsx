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
  const [activeSection, setActiveSection] = useState<'profile' | 'email' | 'password'>('profile');

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
    <div className="user-settings-page">
      {/* Topbar */}
      <div className="topbar-modern">
        <button 
          title="Volver al Dashboard" 
          className="topbar-back-button-modern"
          onClick={onBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="topbar-center">
          <span className="topbar-title">⚙️ Configuración</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="settings-content">
        {/* Mensaje de notificación */}
        {message && (
          <div className={`settings-message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Tabs de navegación */}
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            👤 Perfil
          </button>
          <button 
            className={`settings-tab ${activeSection === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSection('email')}
          >
            📧 Correo
          </button>
          <button 
            className={`settings-tab ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            🔒 Contraseña
          </button>
        </div>

        {/* Sección: Perfil */}
        {activeSection === 'profile' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Información del Perfil</h2>
            
            <div className="settings-field">
              <label className="settings-label">Nombre Completo</label>
              <input
                type="text"
                className="settings-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Nombre de Usuario</label>
              <input
                type="text"
                className="settings-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: jperez"
              />
              <small className="settings-hint">Este es tu identificador único en el sistema</small>
            </div>

            <button 
              className="settings-btn settings-btn-primary"
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}

        {/* Sección: Correo */}
        {activeSection === 'email' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Cambiar Correo Electrónico</h2>
            
            <div className="settings-field">
              <label className="settings-label">Nuevo Correo Electrónico</label>
              <input
                type="email"
                className="settings-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Contraseña Actual</label>
              <input
                type="password"
                className="settings-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese su contraseña actual"
              />
              <small className="settings-hint">Por seguridad, confirme su contraseña</small>
            </div>

            <button 
              className="settings-btn settings-btn-primary"
              onClick={handleUpdateEmail}
              disabled={loading}
            >
              {loading ? '⏳ Actualizando...' : '📧 Actualizar Correo'}
            </button>
          </div>
        )}

        {/* Sección: Contraseña */}
        {activeSection === 'password' && (
          <div className="settings-section">
            <h2 className="settings-section-title">Cambiar Contraseña</h2>
            
            <div className="settings-field">
              <label className="settings-label">Contraseña Actual</label>
              <input
                type="password"
                className="settings-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese su contraseña actual"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Nueva Contraseña</label>
              <input
                type="password"
                className="settings-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                className="settings-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
              />
            </div>

            <button 
              className="settings-btn settings-btn-primary"
              onClick={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? '⏳ Cambiando...' : '🔒 Cambiar Contraseña'}
            </button>
          </div>
        )}

        {/* Sección: Cerrar Sesión */}
        <div className="settings-section settings-danger-zone">
          <h2 className="settings-section-title">Cerrar Sesión</h2>
          <p className="settings-description">
            Cierra tu sesión actual. Deberás ingresar tus credenciales nuevamente para acceder.
          </p>
          <button 
            className="settings-btn settings-btn-danger"
            onClick={onLogout}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
