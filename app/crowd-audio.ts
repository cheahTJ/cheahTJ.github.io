// Original traditional-tune arrangement using licensed Philharmonia trumpet samples.
// Source and sample-use terms are documented in /audio/CREDITS.txt.
export function createCrowdAudio(onBlocked: () => void) {
  const audio = new Audio('/audio/spurs-trumpet.wav');
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  let target = 0;
  let fade: ReturnType<typeof setInterval> | undefined;
  return {
    setAudible(on: boolean) {
      target = on ? 0.32 : 0;
      clearInterval(fade);
      if (!on && typeof document !== 'undefined' && document.hidden) {
        audio.volume = 0;
        audio.pause();
        return;
      }
      if (on)
        void audio.play().catch((error: DOMException) => {
          if (target > 0 && error.name !== 'AbortError') onBlocked();
        });
      fade = setInterval(() => {
        const delta = target - audio.volume;
        if (Math.abs(delta) < 0.008) {
          audio.volume = target;
          clearInterval(fade);
          if (!target) audio.pause();
        } else
          audio.volume = Math.max(0, Math.min(1, audio.volume + delta * 0.16));
      }, 32);
    },
    dispose() {
      clearInterval(fade);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
