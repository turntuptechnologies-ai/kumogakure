import { describe, expect, it } from 'vitest';
import { springActuatorHealth } from '../../../src/bait/templates/spring-actuator-health.js';

const ctx = {
  request: new Request('http://example.test/actuator/health'),
  path: '/actuator/health',
  category: 'cve-recon' as const,
  subcategory: 'spring',
};

describe('spring-actuator-health', () => {
  it('returns UP status as Spring Actuator-style JSON', async () => {
    const response = springActuatorHealth(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/vnd.spring-boot.actuator');
    const json = (await response.json()) as { status: string };
    expect(json.status).toBe('UP');
  });
});
