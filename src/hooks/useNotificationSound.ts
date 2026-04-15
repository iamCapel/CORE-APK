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
    try {
      const ctx = getCtx();
      // Si todavía está suspendido, intentar reanudar (puede ser que haya
      // un gesto en curso en este instante)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const t = ctx.currentTime;

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
    } catch (_) {
      // Silencio si el navegador no soporta Web Audio
    }
  };

  return { play };
}
