// Sequential playback must wait for ended, not just the browser's play() promise.
export class BlockAudio {
  private current: HTMLAudioElement | null = null;
  private cancel: (() => void) | null = null;
  private generation = 0;
  stop() {
    this.generation += 1;
    this.cancel?.();
    this.cancel = null;
    this.current?.pause();
    this.current = null;
  }
  async play(sources: string[]): Promise<boolean> {
    this.stop();
    const generation = this.generation;
    for (const source of sources) {
      if (generation !== this.generation) return false;
      const audio = new Audio(source);
      this.current = audio;
      const ended = await new Promise<boolean>((resolve, reject) => {
        const timer = setTimeout(() => fail(), 20000);
        const cleanup = () => { clearTimeout(timer); audio.onended = null; audio.onerror = null; this.cancel = null; };
        const fail = () => { cleanup(); audio.pause(); reject(new Error('Geluid niet beschikbaar')); };
        this.cancel = () => { cleanup(); audio.pause(); resolve(false); };
        audio.onended = () => { cleanup(); resolve(true); };
        audio.onerror = fail;
        void audio.play().catch(() => { if (generation === this.generation) fail(); });
      });
      if (!ended || generation !== this.generation) return false;
    }
    this.current = null;
    return generation === this.generation;
  }
}
