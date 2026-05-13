import { readD1Migrations } from '@cloudflare/vitest-pool-workers';
import type { TestProject } from 'vitest/node';

export default async function setup({ provide }: TestProject) {
  const migrations = await readD1Migrations('./migrations');
  provide('migrations', migrations);
}

declare module 'vitest' {
  export interface ProvidedContext {
    migrations: Awaited<ReturnType<typeof readD1Migrations>>;
  }
}
