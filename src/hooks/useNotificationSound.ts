/**
 * useNotificationSound
 * Genera un sonido de notificación de chat usando Web Audio API.
 *
 * Problema en Android/WebView: AudioContext arranca SUSPENDIDO y solo se
 * puede reanudar desde dentro de un gesto del usuario (touch/click).
 * Un callback de Firestore NO es un gesto, por lo que ctx.resume() falla
 * en silencio si se llama sin que el contexto ya esté desbloqueado.
 *
 * Solución: singleton de AudioContext al nivel de módulo + listeners globales
 * que lo desbloquean en el primer gesto. Una vez desbloqueado puede usarse
 * desde cualquier callback sin restricción.
 */

// ── Singleton de AudioContext compartido entre todas las instancias del hook ──
let _ctx: AudioContext | null = null;
let _unlocked = false;

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _unlocked = false;
  }
  return _ctx;
}

/** Desbloquea el AudioContext en el primer gesto del usuario. */
function _unlock() {
  if (_unlocked) return;
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Buffer silencioso para desbloquear completamente en Safari/WebView de Android
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        _unlocked = true;
      }).catch(() => {});
    } else {
      _unlocked = true;
    }
  } catch (_) {}
}

// Se registra una sola vez cuando el módulo se carga
if (typeof document !== 'undefined') {
  ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach((ev) =>
    document.addEventListener(ev, _unlock, { passive: true })
  );
}

export function useNotificationSound() {
  const play = async () => {
    console.log('[useNotificationSound] 🎵 Intentando reproducir sonido...');
    
    // Método 1: Web Audio API (preferido)
    try {
      const ctx = getCtx();
      console.log('[useNotificationSound] AudioContext estado:', ctx.state);
      
      // Si todavía está suspendido, intentar reanudar (puede ser que haya
      // un gesto en curso en este instante)
      if (ctx.state === 'suspended') {
        console.log('[useNotificationSound] ⏸️ AudioContext suspendido, intentando reanudar...');
        await ctx.resume();
        console.log('[useNotificationSound] ▶️ AudioContext estado después de resume:', ctx.state);
      }
      
      if (ctx.state === 'running') {
        const t = ctx.currentTime;
        console.log('[useNotificationSound] ⏰ Tiempo actual:', t);

        // Tono 1 – breve acento agudo
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t);
        osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
        gain1.gain.setValueAtTime(0.18, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc1.start(t);
        osc1.stop(t + 0.18);

        // Tono 2 – nota más baja con pequeño delay
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, t + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(880, t + 0.22);
        gain2.gain.setValueAtTime(0.0001, t + 0.1);
        gain2.gain.linearRampToValueAtTime(0.14, t + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc2.start(t + 0.1);
        osc2.stop(t + 0.32);
        
        console.log('[useNotificationSound] ✅ Sonido Web Audio iniciado correctamente');
        return;
      } else {
        console.warn('[useNotificationSound] ⚠️ AudioContext no está running, intentando método alternativo...');
      }
    } catch (error) {
      console.error('[useNotificationSound] ❌ Error con Web Audio API:', error);
    }
    
    // Método 2: HTML5 Audio (fallback)
    console.log('[useNotificationSound] 🔄 Intentando método alternativo (HTML5 Audio)...');
    try {
      // Crear un audio con data URL (tono simple)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      console.log('[useNotificationSound] ✅ Sonido HTML5 Audio iniciado');
    } catch (altError) {
      console.error('[useNotificationSound] ❌ Error con método alternativo:', altError);
      
      // Método 3: Vibración como último recurso
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
          console.log('[useNotificationSound] 📳 Vibración como fallback');
        }
      } catch (vibError) {
        console.error('[useNotificationSound] ❌ Error con vibración:', vibError);
      }
    }
  };

  return { play };
}
