import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';

// Nota: Interceptamos el evento `popstate` de la ventana, que es
// disparado cuando el usuario presiona el botón "atrás" del
// dispositivo Android o usa la navegación del navegador.
// Esto simula el comportamiento nativo de retroceso en la aplicación.

function App() {
  useEffect(() => {
    const handleBackButton = () => {
      document.body.classList.add('hide-back-icons');
      
      // Buscar cualquier botón de retroceso visible en la página actual
      const backBtn = document.querySelector<HTMLButtonElement>(
        'button.back-button, button.topbar-back-button, button.topbar-back-btn, button.topbar-back-btn-modern, button.back-btn'
      );
      
      if (backBtn) {
        // Simular clic en el botón de retroceso
        backBtn.click();
      }
      
      setTimeout(() => {
        document.body.classList.remove('hide-back-icons');
      }, 500);
    };

    // Escuchar el evento popstate (botón atrás del navegador/Android)
    window.addEventListener('popstate', handleBackButton);
    
    // También manejar el evento de tecla Escape como retroceso adicional
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackButton();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;