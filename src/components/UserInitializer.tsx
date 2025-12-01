/**
 * UserInitializer - Componente que garantiza que los usuarios estén cargados
 * Se ejecuta automáticamente al iniciar la aplicación
 */

import { useEffect, useState } from 'react';
import { userStorage } from '../services/userStorage';

export const UserInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeUsers = async () => {
      try {
        console.log('🔄 Inicializando sistema de usuarios...');
        
        // Verificar cuántos usuarios hay
        const users = userStorage.getAllUsers();
        console.log(`📊 Usuarios encontrados: ${users.length}`);
        
        if (users.length === 0) {
          console.warn('⚠️ No hay usuarios en localStorage. El sistema debería cargarlos automáticamente.');
          
          // Esperar un momento para que el constructor termine
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar nuevamente
          const usersAfterWait = userStorage.getAllUsers();
          console.log(`📊 Usuarios después de espera: ${usersAfterWait.length}`);
          
          if (usersAfterWait.length === 0) {
            throw new Error('No se pudieron cargar los usuarios predefinidos. Verifique la consola.');
          }
        }
        
        // Mostrar usuarios disponibles
        const usernames = users.map(u => u.username).join(', ');
        console.log(`✅ Sistema de usuarios listo. Disponibles: ${usernames}`);
        
        setIsReady(true);
      } catch (err) {
        console.error('❌ Error al inicializar usuarios:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setIsReady(true); // Permitir continuar de todos modos
      }
    };

    initializeUsers();
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Inicializando sistema...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>Cargando usuarios</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(244, 67, 54, 0.9)',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Error al Inicializar</div>
          <div style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.9 }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'white',
              color: '#f44336',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Reintentar
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid white',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🗑️ Limpiar y Reiniciar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserInitializer;
