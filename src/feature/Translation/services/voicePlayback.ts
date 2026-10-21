interface VoiceOptions {
  text: string;
  language: string;
  translationId?: number;
  record: (body: Record<string, unknown>) => Promise<{ playbackId?: string } | undefined>;
  speak: (text: string, options: { language: string; onDone: () => void; onStopped: () => void; onError: () => void }) => unknown;
  stop: () => unknown;
  onFinish: () => void;
}

/** Only onDone can complete a server playback. Stop/error/unmount invalidate it once. */
export const beginVoicePlayback = (options: VoiceOptions) => {
  let settled = false;
  let playbackId: string | undefined;
  const report = (completed: boolean) => {
    if (playbackId) void options.record({kind: completed ? 'voice-end' : 'voice-cancel',playbackId}).catch(()=>undefined);
  };
  const finish = (completed: boolean) => {
    if (settled) return;
    settled = true; report(completed); options.onFinish();
  };
  void (async () => {
    if (options.translationId) {
      try { playbackId = (await options.record({kind:'voice-start',translationId:options.translationId}))?.playbackId; }
      catch { /* Reading is independent from the availability of achievement telemetry. */ }
    } else { await Promise.resolve(); }
    if (settled) { report(false); return; }
    try { options.speak(options.text,{language:options.language,onDone:()=>finish(true),onStopped:()=>finish(false),onError:()=>finish(false)}); }
    catch { finish(false); }
  })();
  return { cancel: () => { finish(false); options.stop(); } };
};
