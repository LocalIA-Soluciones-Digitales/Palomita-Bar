// Aviso sonoro de "pedido nuevo" sintetizado con Web Audio API — sin
// depender de ningún archivo de audio. Los navegadores bloquean el audio
// hasta que ha habido una interacción del usuario en la página; si no la
// ha habido todavía, falla en silencio (el aviso visual sigue funcionando
// igualmente).
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  return audioContext;
}

function tono(ctx: AudioContext, frecuencia: number, inicio: number, duracion: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = frecuencia;

  gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + inicio + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracion);

  oscillator.start(ctx.currentTime + inicio);
  oscillator.stop(ctx.currentTime + inicio + duracion);
}

export function playNewOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    tono(ctx, 880, 0, 0.18);
    tono(ctx, 1175, 0.12, 0.22);
  } catch {
    // El aviso visual (parpadeo) sigue funcionando aunque el sonido falle.
  }
}
