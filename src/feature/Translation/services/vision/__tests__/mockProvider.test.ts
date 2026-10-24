import { mockProvider } from '../mockProvider';

const frame = (base64: string): Parameters<typeof mockProvider.detect>[0] => ({
  base64,
  width: 640,
  height: 480,
  capturedAt: '2026-10-23T00:00:00.000Z',
});

describe('mockProvider', () => {
  afterEach(() => mockProvider.dispose?.());

  it('el mismo frame da siempre el mismo resultado', async () => {
    const a = await mockProvider.detect(frame('abc'.repeat(200)));
    mockProvider.dispose?.();
    const b = await mockProvider.detect(frame('abc'.repeat(200)));
    expect(a).toEqual(b);
  });

  it('entrega estados validos y confianza entre 0 y 1', async () => {
    for (let i = 0; i < 50; i++) {
      const r = await mockProvider.detect(frame(`frame-${i}`));
      expect(['no_hands', 'low_confidence', 'detecting']).toContain(r.status);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(r.timestamp).toBe('2026-10-23T00:00:00.000Z');
    }
  });
});
