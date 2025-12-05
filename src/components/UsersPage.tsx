import React, { useState, useEffect } from 'react';
import { reportStorage } from '../services/reportStorage';
import { pendingReportStorage } from '../services/pendingReportStorage';
import { userStorage } from '../services/userStorage';
import './UsersPage.css';
import './Dashboard.css';
import PendingReportsModal from './PendingReportsModal';

interface User {
  username: string;
  name: string;
}

interface UsersPageProps {
  user: User;
  onBack: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified?: boolean;
  lastSeen: string;
  avatar?: string;
  department: string;
  reportsCount: number;
  joinDate: string;
  pendingReportsCount?: number;
  password?: string;  // Contraseña (opcional para edición)
  cedula?: string;  // Número de cédula
  notes?: Array<{
    id: string;
    tipo: string;
    contenido: string;
    creadoPor: string;
    fecha: string;
  }>;
  currentLocation: {
    province: string;
    municipality: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    lastUpdated: string;
  };
}

interface UserReport {
  id: string;
  title: string;
  date: string;
  status: 'Completado' | 'En Progreso' | 'Pendiente';
  province: string;
  type: string;
}

const UsersPage: React.FC<UsersPageProps> = ({ user, onBack }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [gpsUpdateNotification, setGpsUpdateNotification] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAdminUserModal, setShowAdminUserModal] = useState(false);
  const [showCreateUserPage, setShowCreateUserPage] = useState(false);
  const [showAdminUserPage, setShowAdminUserPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedPendingReport, setSelectedPendingReport] = useState<UserReport | null>(null);
  const [showPendingReportPreview, setShowPendingReportPreview] = useState(false);
  
  // Estados para el formulario de crear usuario
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    cedula: '',
    role: 'Técnico'
  });
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Estados para notificaciones
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Función para actualizar el contador de pendientes
  const updatePendingCount = () => {
    const pendientes = pendingReportStorage.getPendingCount();
    setPendingCount(pendientes);
  };

  // Función para obtener lista detallada de reportes pendientes
  const getPendingReports = () => {
    const pendingReports = pendingReportStorage.getAllPendingReports();
    return pendingReports.map(report => ({
      id: report.id,
      reportNumber: `DCR-${report.id.split('_').pop()?.slice(-6) || '000000'}`,
      timestamp: report.timestamp,
      estado: 'pendiente',
      region: report.formData.region || 'N/A',
      provincia: report.formData.provincia || 'N/A',
      municipio: report.formData.municipio || 'N/A',
      tipoIntervencion: report.formData.tipoIntervencion || 'No especificado'
    }));
  };

  const handleContinuePendingReport = (reportId: string) => {
    alert('Función de continuar reporte desde UsersPage - redirigir a formulario');
    setShowPendingModal(false);
  };

  const handleCancelPendingReport = (reportId: string) => {
    pendingReportStorage.deletePendingReport(reportId);
    updatePendingCount();
    setShowPendingModal(false);
    setTimeout(() => setShowPendingModal(true), 100);
  };

  // Cargar usuarios desde userStorage
  useEffect(() => {
    const loadedUsers = userStorage.getAllUsers();
    
    // Calcular pendingReportsCount para cada usuario desde pendingReportStorage
    const usersWithPendingCounts = loadedUsers.map(user => ({
      ...user,
      pendingReportsCount: pendingReportStorage.getUserPendingReports(user.username).length
    }));

    setUsers(usersWithPendingCounts);
  }, []);

  // Actualizar contador al cargar y cada vez que cambie localStorage
  useEffect(() => {
    updatePendingCount();
    
    // Actualizar pendingReportsCount de todos los usuarios periódicamente
    const updateUsersPendingCounts = () => {
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          pendingReportsCount: pendingReportStorage.getUserPendingReports(user.username).length
        }))
      );
    };
    
    const interval = setInterval(() => {
      updatePendingCount();
      updateUsersPendingCounts();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUserClick = (clickedUser: UserProfile) => {
    setSelectedUser(clickedUser);
    
    // Cargar reportes pendientes reales del usuario desde pendingReportStorage
    const pendingReports = pendingReportStorage.getUserPendingReports(clickedUser.username);
    const formattedPendingReports: UserReport[] = pendingReports.map(report => ({
      id: report.id,
      title: report.formData.tipoIntervencion || 'Intervención',
      date: new Date(report.timestamp).toLocaleDateString(),
      status: 'Pendiente' as const,
      province: report.formData.provincia || 'N/A',
      type: report.formData.tipoIntervencion || 'No especificado'
    }));
    
    setUserReports(formattedPendingReports);
    setShowUserDetail(true);
  };

  const handleBackToUsers = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
    setUserReports([]);
  };

  const handleCreateUser = () => {
    // Validar campos obligatorios
    if (!newUserForm.name.trim() || !newUserForm.username.trim() || !newUserForm.password.trim() || !newUserForm.email.trim()) {
      alert('Por favor complete todos los campos obligatorios (Nombre, Usuario, Contraseña, Email)');
      return;
    }

    // Validar que el username no exista
    const existingUser = userStorage.getUserByUsername(newUserForm.username);
    if (existingUser) {
      alert('El nombre de usuario ya existe. Por favor elija otro.');
      return;
    }

    try {
      // Crear el usuario en userStorage con valores por defecto
      const userId = userStorage.saveUser({
        username: newUserForm.username,
        password: newUserForm.password,  // Guardar contraseña
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone,
        cedula: newUserForm.cedula,  // Guardar número de cédula
        role: newUserForm.role,
        department: 'Sin asignar',
        isActive: true,
        isVerified: false,  // Nuevo usuario no verificado por defecto
        lastSeen: 'Ahora',
        joinDate: new Date().toISOString(),
        currentLocation: {
          province: 'Sin asignar',
          municipality: 'Sin asignar',
          coordinates: {
            lat: -25.2637,
            lng: -57.5759
          },
          lastUpdated: new Date().toISOString()
        },
        reportsCount: 0
      });

      // Mostrar animación de éxito
      setShowSuccessAnimation(true);

      // Recargar la lista de usuarios
      setTimeout(() => {
        const loadedUsers = userStorage.getAllUsers();
        const usersWithPendingCounts = loadedUsers.map(u => ({
          ...u,
          pendingReportsCount: pendingReportStorage.getUserPendingReports(u.username).length
        }));
        setUsers(usersWithPendingCounts);

        // Cerrar modal después de la animación
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setShowCreateUserPage(false);
          // Resetear formulario
          setNewUserForm({
            name: '',
            username: '',
            password: '',
            email: '',
            phone: '',
            cedula: '',
            role: 'Técnico'
          });
        }, 1500);
      }, 500);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Error al crear el usuario. Por favor intente nuevamente.');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return '#28a745';
      case 'En Progreso': return '#ffc107';
      case 'Pendiente': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Simular actualización de GPS
  const simulateGPSUpdate = () => {
    if (!selectedUser) return;
    
    const paraguayLocations = [
      { province: 'Central', municipality: 'Asunción', lat: -25.2637, lng: -57.5759 },
      { province: 'Central', municipality: 'San Lorenzo', lat: -25.3371, lng: -57.5044 },
      { province: 'Central', municipality: 'Luque', lat: -25.2650, lng: -57.4942 },
      { province: 'Alto Paraná', municipality: 'Ciudad del Este', lat: -25.5138, lng: -54.6158 },
      { province: 'Itapúa', municipality: 'Encarnación', lat: -27.3300, lng: -55.8663 },
      { province: 'Cordillera', municipality: 'Caacupé', lat: -25.3864, lng: -57.1439 },
      { province: 'Paraguarí', municipality: 'Paraguarí', lat: -25.6117, lng: -57.1286 },
      { province: 'Ñeembucú', municipality: 'Pilar', lat: -26.8667, lng: -58.3000 },
    ];
    
    const randomLocation = paraguayLocations[Math.floor(Math.random() * paraguayLocations.length)];
    
    const updatedUser = {
      ...selectedUser,
      currentLocation: {
        ...randomLocation,
        coordinates: { lat: randomLocation.lat, lng: randomLocation.lng },
        lastUpdated: 'Ahora'
      }
    };
    
    setSelectedUser(updatedUser);
    
    // Actualizar también en la lista de usuarios
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      )
    );
    
    // Mostrar notificación temporal
    setGpsUpdateNotification(`📍 GPS actualizado: ${randomLocation.province}, ${randomLocation.municipality}`);
    setTimeout(() => {
      setGpsUpdateNotification('');
    }, 3000);
  };

  // Modo de vista de agrupación
  const [groupingMode, setGroupingMode] = useState<'rendimiento' | 'asignaciones'>('rendimiento');
  
  // Estados para asignaciones
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserForNotes, setSelectedUserForNotes] = useState<UserProfile | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'observacion' | 'amonestacion' | 'pendiente'>('observacion');

  // Agrupar usuarios por estado
  const activeUsers = users.filter(u => u.isActive);
  const inactiveUsers = users.filter(u => !u.isActive);
  const usersWithPendingReports = users.filter(u => u.pendingReportsCount && u.pendingReportsCount > 0);

  // Agrupar usuarios por rol
  const usersByRole = users.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  // Agrupar usuarios por departamento
  const usersByDepartment = users.reduce((acc, user) => {
    if (!acc[user.department]) {
      acc[user.department] = [];
    }
    acc[user.department].push(user);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  // Agrupar usuarios por provincia
  const usersByProvince = users.reduce((acc, user) => {
    const province = user.currentLocation.province;
    if (!acc[province]) {
      acc[province] = [];
    }
    acc[province].push(user);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  // Ranking de usuarios por rendimiento (reportes registrados)
  const usersByPerformance = [...users].sort((a, b) => b.reportsCount - a.reportsCount);
  const maxReports = Math.max(...users.map(u => u.reportsCount), 1);

  // Filtrar usuarios en búsqueda del modal de administración
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showUserDetail && selectedUser) {
    return (
      <div className="users-page">
        <div className="users-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBackToUsers}>
              ← Volver a Usuarios
            </button>
            <h1 className="page-title">
              👤 Perfil de Usuario
            </h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="welcome-text">Bienvenido, {user.name}</span>
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            </div>
            {/* Ícono de notificaciones - posicionado a la derecha */}
            <div className="notification-container" style={{ position: 'relative', cursor: 'pointer', marginLeft: '15px' }}>
              <img 
                src="/images/notification-bell-icon.svg" 
                alt="Notificaciones" 
                style={{
                  width: '24px', 
                  height: '24px',
                  filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: pendingCount > 0 ? 'bellShake 0.5s ease-in-out infinite alternate' : 'none'
                }}
                onClick={() => setShowPendingModal(true)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 3px 6px rgba(255, 152, 0, 0.6))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4))';
                }}
              />
              {/* Contador de notificaciones */}
              {pendingCount > 0 && (
                <span 
                  className="notification-badge"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    animation: 'badgeGlow 2s infinite'
                  }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notificación de GPS */}
        {gpsUpdateNotification && (
          <div className="gps-notification">
            {gpsUpdateNotification}
          </div>
        )}

        <div className="user-detail-content">
          <div className="user-profile-card">
            <div className="profile-header">
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {getInitials(selectedUser.name)}
                </div>
                <div className={`status-indicator ${selectedUser.isActive ? 'active' : 'inactive'}`}></div>
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{selectedUser.name}</h2>
                <p className="profile-location">📍 {selectedUser.currentLocation.province}, {selectedUser.currentLocation.municipality}</p>
                <p className="profile-department">{selectedUser.department}</p>
                <div className="profile-status">
                  <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                    {selectedUser.isActive ? '🟢 Activo' : '⚫ Inactivo'}
                  </span>
                  <span className="last-seen">Última vez: {selectedUser.lastSeen}</span>
                </div>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedUser.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Usuario:</span>
                <span className="detail-value">{selectedUser.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de ingreso:</span>
                <span className="detail-value">{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Reportes totales:</span>
                <span className="detail-value">{selectedUser.reportsCount}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📍 Ubicación actual:</span>
                <span className="detail-value">{selectedUser.currentLocation.province}, {selectedUser.currentLocation.municipality}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🌐 Coordenadas GPS:</span>
                <span className="detail-value">{selectedUser.currentLocation.coordinates.lat.toFixed(4)}, {selectedUser.currentLocation.coordinates.lng.toFixed(4)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">🕒 GPS actualizado:</span>
                <span className="detail-value">{selectedUser.currentLocation.lastUpdated}</span>
              </div>
            </div>
            
            {/* Botón de simulación GPS */}
            <div className="gps-simulation">
              <button className="gps-update-button" onClick={simulateGPSUpdate}>
                🔄 Simular Actualización GPS
              </button>
              <p className="gps-note">Haz clic para simular un cambio de ubicación GPS del usuario</p>
            </div>
          </div>

          <div className="user-reports-section">
            <h3 className="reports-title">📋 Reportes del Usuario ({userReports.length})</h3>
            
            {userReports.length > 0 ? (
              <div className="reports-grid">
                {userReports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <h4 className="report-title">{report.title}</h4>
                      <span 
                        className="report-status"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="report-details">
                      <div className="report-detail">
                        <span className="detail-icon">📅</span>
                        <span>{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-icon">📍</span>
                        <span>{report.province}</span>
                      </div>
                      <div className="report-detail">
                        <span className="detail-icon">🔖</span>
                        <span>{report.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reports">
                <div className="no-reports-icon">📝</div>
                <p>Este usuario aún no ha creado reportes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Topbar estilo Dashboard */}
      <div className="topbar">
        <button className="topbar-back-button" onClick={onBack}>
          ←
        </button>
        <h1 className="topbar-title">Usuarios</h1>
        <div className="topbar-avatar" onClick={() => setShowPendingModal(true)} style={{ position: 'relative', cursor: 'pointer' }}>
          {pendingCount > 0 && (
            <span 
              className="notification-badge"
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '2px solid white',
                zIndex: 1
              }}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </div>
      </div>

      <div className="users-page" style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>

      {/* Página de Crear Usuario */}
      {showCreateUserPage && (
        <div className="create-user-page">
          <div className="topbar" style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '430px',
            height: '56px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <button 
              onClick={() => setShowCreateUserPage(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FF7A00' }}>
              Crear Nuevo Usuario
            </h1>
            <div style={{ width: '40px' }}></div>
          </div>

          <div style={{ paddingTop: '72px', paddingBottom: '80px' }}>
            {showSuccessAnimation && (
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3000,
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
                <h3 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>¡Usuario Agregado!</h3>
              </div>
            )}

            <div style={{ padding: '0 16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez Gómez"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Usuario *
                </label>
                <input
                  type="text"
                  placeholder="Ej: jperez"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Contraseña *
                </label>
                <input
                  type="password"
                  placeholder="Ingrese la contraseña"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="Ej: jperez@mopc.gov.py"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 0981234567"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Cédula
                </label>
                <input
                  type="text"
                  placeholder="Ej: 1234567"
                  value={newUserForm.cedula}
                  onChange={(e) => setNewUserForm({ ...newUserForm, cedula: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Rol *
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}
                >
                  <option value="Técnico">Técnico</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div style={{ 
                position: 'fixed', 
                bottom: 0, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '100%', 
                maxWidth: '430px', 
                padding: '16px', 
                backgroundColor: 'white', 
                borderTop: '1px solid #eee', 
                display: 'flex', 
                gap: '12px',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={() => {
                    setShowCreateUserPage(false);
                    setNewUserForm({ name: '', username: '', password: '', email: '', phone: '', cedula: '', role: 'Técnico' });
                  }}
                  style={{ flex: 1, padding: '14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  style={{ flex: 1, padding: '14px', backgroundColor: '#FF7A00', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Crear Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Página de Administrar Usuario */}
      {showAdminUserPage && (
        <div className="admin-user-page">
          <div className="topbar" style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '430px',
            height: '56px',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <button 
              onClick={() => setShowAdminUserPage(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#FF7A00' }}>
              Administrar Usuario
            </h1>
            <div style={{ width: '40px' }}></div>
          </div>

          <div style={{ 
            paddingTop: '72px', 
            paddingBottom: '16px',
            padding: '72px 16px 16px 16px',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#333'
              }}>
                Buscar Usuario
              </h2>
              
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, usuario o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  marginBottom: '16px'
                }}
              />

              <div style={{
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                {users
                  .filter(u => 
                    searchQuery === '' ||
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedAdminUser(user);
                        setEditingUser({ ...user });
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        border: selectedAdminUser?.id === user.id ? '2px solid #FF7A00' : '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#FF7A00',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {getInitials(user.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            @{user.username} • {user.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {users.filter(u => 
                  searchQuery === '' ||
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    No se encontraron usuarios
                  </div>
                )}
              </div>
            </div>

            {selectedAdminUser && editingUser && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginTop: '16px'
              }}>
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#333'
                }}>
                  Editar Usuario
                </h2>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Rol
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}
                  >
                    <option value="Técnico">Técnico</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      if (editingUser) {
                        setUsers(prevUsers => 
                          prevUsers.map(u => u.id === editingUser.id ? editingUser : u)
                        );
                        const updateData: any = {
                          name: editingUser.name,
                          username: editingUser.username,
                          email: editingUser.email,
                          role: editingUser.role,
                        };
                        userStorage.updateUser(editingUser.id, updateData);
                        alert('✅ Cambios guardados exitosamente');
                        setSelectedAdminUser(null);
                        setEditingUser(null);
                      }
                    }}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      cursor: 'pointer' 
                    }}
                  >
                    💾 Guardar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
                        if (editingUser) {
                          const deleted = userStorage.deleteUser(editingUser.id);
                          if (deleted) {
                            setUsers(prevUsers => prevUsers.filter(u => u.id !== editingUser.id));
                            alert('✅ Usuario eliminado exitosamente');
                            setSelectedAdminUser(null);
                            setEditingUser(null);
                          } else {
                            alert('❌ Error al eliminar el usuario');
                          }
                        }
                      }
                    }}
                    style={{ 
                      flex: 1, 
                      padding: '14px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      cursor: 'pointer' 
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor principal agrupado */}
      {!showCreateUserPage && !showAdminUserPage && (
      <div className="users-main-container">
        {/* Panel de control - Acciones principales */}
        <div className="users-control-panel">

          <div className="control-actions">
            <button className="action-button create-user-btn" onClick={() => setShowCreateUserPage(true)}>
              <span className="action-text">Crear Usuario</span>
            </button>
            <button className="action-button admin-user-btn" onClick={() => setShowAdminUserPage(true)}>
              <span className="action-text">Administrar Usuario</span>
            </button>
          </div>
        </div>

      <div className="users-content">
        {/* Modo: Ranking de Rendimiento */}
          <div className="users-section">
            <div className="performance-ranking">
              {usersByPerformance.map((userProfile, index) => {
                const percentage = (userProfile.reportsCount / maxReports) * 100;
                return (
                  <div 
                    key={userProfile.id} 
                    className="performance-item"
                    onClick={() => handleUserClick(userProfile)}
                  >
                    <div className="performance-user-info">
                      <div className="performance-details">
                        <div className="performance-header">
                          <h3 className="performance-name">{userProfile.name}</h3>
                          <span className="performance-role-badge">{userProfile.role}</span>
                        </div>
                        <p className="performance-location">
                          {userProfile.currentLocation.province} • {userProfile.department}
                        </p>
                        
                        <div className="performance-bar-container">
                          <div className="performance-bar-bg">
                            <div 
                              className="performance-bar-fill"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="performance-bar-label">
                                {userProfile.reportsCount} reportes
                              </span>
                            </div>
                          </div>
                          <span className="performance-percentage">{percentage.toFixed(0)}%</span>
                        </div>

                        {userProfile.pendingReportsCount !== undefined && userProfile.pendingReportsCount > 0 && (
                          <div className="performance-pending">
                            ⚠️ {userProfile.pendingReportsCount} reporte{userProfile.pendingReportsCount > 1 ? 's' : ''} pendiente{userProfile.pendingReportsCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal de Reportes Pendientes */}
      <PendingReportsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        reports={getPendingReports()}
        onContinueReport={handleContinuePendingReport}
        onCancelReport={handleCancelPendingReport}
      />
    </div>
    </div>
  );
};

export default UsersPage;
