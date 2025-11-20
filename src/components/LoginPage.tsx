import React from 'react';
import mopcLogo from '../logo.svg';

const LoginPage: React.FC = () => {
  return (
    <div className="login-container">
      <img src={mopcLogo} alt="MOPC Logo" className="login-logo" />
      <h2>Iniciar Sesión</h2>
      {/* ...aquí irían los campos de usuario y contraseña normales... */}
      <div style={{ marginTop: '24px', textAlign: 'center', color: '#555', fontSize: '0.95rem' }}>
        ¿Olvidaste tu contraseña? | <span style={{ color: '#222', fontWeight: 'bold' }}>¿Tienes código de administrador?</span>
      </div>
    </div>
  );
};

export default LoginPage;
