import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';

// Nota: no usamos el plugin @capacitor/app porque la versión actual
// del proyecto es 7.x y el plugin requiere >=8. En su lugar
// interceptamos el evento `popstate` de la ventana, que también
// es disparado cuando el usuario presiona el botón "atrás" del
// dispositivo Android o el navegador real.

function App() {
  useEffect(() => {
    const handlePop = () => {
      document.body.classList.add('hide-back-icons');
      const backBtn = document.querySelector<HTMLButtonElement>(
        'button.back-button, button.topbar-back-button, button.topbar-back-btn, button.topbar-back-btn-modern'
      );
      if (backBtn) {
        backBtn.click();
      }
      setTimeout(() => {
        document.body.classList.remove('hide-back-icons');
      }, 500);
    };

    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, []);
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;