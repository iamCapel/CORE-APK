/**
 * useNotificationSound
 * Genera un sonido de notificación de chat usando Web Audio API.
 * No requiere archivos externos.
 */
export function useNotificationSound() {
  const play = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Tono 1 – breve acento agudo
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.18);

      // Tono 2 – nota más baja con pequeño delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.0001, ctx.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.32);

      // Cerrar el contexto luego de que termina
      setTimeout(() => ctx.close(), 500);
    } catch (_) {
      // Silencio si el navegador no soporta Web Audio
    }
  };

  return { play };
}
