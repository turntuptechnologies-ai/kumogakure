import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeAll, inject } from 'vitest';

beforeAll(async () => {
  const migrations = inject('migrations');
  await applyD1Migrations(env.DB, migrations);
});
