import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './xiaomi-styles.css'; // Estilos optimizados para Xiaomi Redmi
import App from './App';
import reportWebVitals from './reportWebVitals';
import UserInitializer from './components/UserInitializer';
import initXiaomiOptimizations from './xiaomi-optimizations'; // Optimizaciones para Xiaomi

// Inicializar optimizaciones específicas de Xiaomi Redmi
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initXiaomiOptimizations();
    });
  } else {
    initXiaomiOptimizations();
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <UserInitializer>
      <App />
    </UserInitializer>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
