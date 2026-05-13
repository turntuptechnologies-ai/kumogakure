import { describe, expect, it, vi } from 'vitest';
import { insertRequest } from '../../../src/storage/d1.js';
import type { Env, RequestRecord } from '../../../src/types.js';

function buildEnv() {
  const run = vi.fn().mockResolvedValue({ success: true });
  const bind = vi.fn().mockReturnValue({ run });
  const prepare = vi.fn().mockReturnValue({ bind });
  const env = {
    DB: { prepare } as unknown as D1Database,
    PAYLOADS: {} as R2Bucket,
    BODY_R2_THRESHOLD: '8192',
    RETENTION_DAYS: '30',
  } satisfies Env;
  return { env, prepare, bind, run };
}

const baseRecord: RequestRecord = {
  id: '0193a000-1111-7222-8333-444444444444',
  ts: 1747000000,
  method: 'GET',
  path: '/wp-login.php',
  status: 200,
};

describe('insertRequest', () => {
  it('prepares the INSERT statement and runs it', async () => {
    const { env, prepare, run } = buildEnv();
    await insertRequest(env, baseRecord);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0]?.[0]).toContain('INSERT INTO requests');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('binds null for absent optional fields', async () => {
    const { env, bind } = buildEnv();
    await insertRequest(env, baseRecord);
    const args = bind.mock.calls[0] ?? [];
    expect(args[0]).toBe(baseRecord.id);
    expect(args[1]).toBe(baseRecord.ts);
    expect(args[2]).toBeNull(); // ip
    expect(args[3]).toBeNull(); // asn
  });

  it('serialises the signals array as JSON', async () => {
    const { env, bind } = buildEnv();
    await insertRequest(env, { ...baseRecord, signals: ['log4j', 'sqli'] });
    const args = bind.mock.calls[0] ?? [];
    // signals column is the 16th bind argument (index 15)
    expect(args[15]).toBe(JSON.stringify(['log4j', 'sqli']));
  });
});
