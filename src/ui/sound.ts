/* Blok sonu sesi. AudioContext ilk tıklamada açılır. */

let audioCtx: AudioContext | null = null;

export function ensureAudio(): void {
  try {
    if (!audioCtx) {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      audioCtx = new (w.AudioContext || w.webkitAudioContext)!();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {
    /* ses yoksa sessiz devam */
  }
}

export function beep(): void {
  try {
    if (!audioCtx) return;
    const ctx = audioCtx;
    [0, 0.28].forEach((d, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i ? 660 : 520;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + d);
      o.stop(ctx.currentTime + d + 0.3);
    });
  } catch (e) {
    /* yok say */
  }
}
