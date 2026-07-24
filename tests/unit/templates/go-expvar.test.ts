import { describe, expect, it } from 'vitest';
import { goExpvar } from '../../../src/bait/templates/go-expvar.js';

const ctx = () => ({
  request: new Request('http://example.test/debug/vars'),
  path: '/debug/vars',
  category: 'cve-recon' as const,
  subcategory: 'go-expvar',
});

interface MemStats {
  Alloc: number;
  TotalAlloc: number;
  Sys: number;
  Mallocs: number;
  Frees: number;
  HeapAlloc: number;
  HeapSys: number;
  HeapIdle: number;
  HeapInuse: number;
  HeapReleased: number;
  HeapObjects: number;
  StackSys: number;
  MSpanSys: number;
  MCacheSys: number;
  BuckHashSys: number;
  GCSys: number;
  OtherSys: number;
  LastGC: number;
  PauseTotalNs: number;
  PauseNs: number[];
  PauseEnd: number[];
  NumGC: number;
  EnableGC: boolean;
  BySize: Array<{ Size: number; Mallocs: number; Frees: number }>;
}

const read = async () => {
  const response = goExpvar(ctx());
  return { response, json: (await response.json()) as { cmdline: string[]; memstats: MemStats } };
};

describe('go-expvar', () => {
  it('serves the expvar document shape as JSON', async () => {
    const { response, json } = await read();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(Array.isArray(json.cmdline)).toBe(true);
    expect(json.cmdline[0]).toMatch(/^\//);
    expect(json.memstats.EnableGC).toBe(true);
  });

  it('uses expvar’s own bare-brace framing rather than indented JSON', async () => {
    const text = await goExpvar(ctx()).text();
    expect(text.startsWith('{\n"cmdline": ')).toBe(true);
    expect(text.endsWith('}\n')).toBe(true);
    expect(text).toContain('\n"memstats": {');
  });

  it('publishes no secret-bearing flags in cmdline', async () => {
    const { json } = await read();
    for (const arg of json.cmdline) {
      expect(arg, arg).not.toMatch(/(pass|secret|token|key|credential|dsn)/i);
    }
  });

  it('reports memory arenas that add up', async () => {
    const m = (await read()).json.memstats;
    expect(m.HeapInuse + m.HeapIdle).toBe(m.HeapSys);
    expect(
      m.HeapSys + m.StackSys + m.MSpanSys + m.MCacheSys + m.BuckHashSys + m.GCSys + m.OtherSys,
    ).toBe(m.Sys);
    expect(m.HeapAlloc).toBe(m.Alloc);
    expect(m.Alloc).toBeLessThanOrEqual(m.HeapInuse);
    expect(m.HeapReleased).toBeLessThanOrEqual(m.HeapIdle);
    expect(m.TotalAlloc).toBeGreaterThan(m.Alloc);
  });

  it('reports allocation counts consistent with the BySize histogram', async () => {
    const m = (await read()).json.memstats;
    expect(m.HeapObjects).toBe(m.Mallocs - m.Frees);
    const bucketMallocs = m.BySize.reduce((total, b) => total + b.Mallocs, 0);
    const bucketFrees = m.BySize.reduce((total, b) => total + b.Frees, 0);
    // Large allocations have no size class, so the buckets account for most
    // but not all of the totals.
    expect(bucketMallocs).toBeLessThan(m.Mallocs);
    expect(bucketFrees).toBeLessThan(m.Frees);
    for (const b of m.BySize) {
      expect(b.Frees, `size ${b.Size}`).toBeLessThanOrEqual(b.Mallocs);
      expect(b.Frees, `size ${b.Size}`).toBeGreaterThanOrEqual(0);
    }
    expect(m.BySize[0]).toEqual({ Size: 0, Mallocs: 0, Frees: 0 });
  });

  it('keeps the GC pause ring buffers full and anchored to a recent LastGC', async () => {
    const text = await goExpvar(ctx()).text();
    const m = (JSON.parse(text) as { memstats: MemStats }).memstats;
    expect(m.PauseNs).toHaveLength(256);
    expect(m.PauseEnd).toHaveLength(256);
    expect(m.NumGC).toBeGreaterThan(256);
    expect(m.PauseTotalNs).toBeGreaterThan(Math.max(...m.PauseNs));
    // Slot NumGC % 256 holds the most recent collection, so its end time is
    // LastGC itself; every other slot is older.
    const lastGcNs = Number(/"LastGC":(\d+),/.exec(text)?.[1]);
    expect(Number.isFinite(lastGcNs)).toBe(true);
    expect(Math.abs(lastGcNs / 1e6 - Date.now())).toBeLessThan(60_000);
    for (const end of m.PauseEnd) expect(end).toBeLessThanOrEqual(lastGcNs);
  });

  it('emits no canary / tracking headers', () => {
    const response = goExpvar(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
