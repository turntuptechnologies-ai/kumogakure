import { describe, expect, it } from 'vitest';
import { springActuatorEnv } from '../../../src/bait/templates/spring-actuator-env.js';

const ctx = {
  request: new Request('http://example.test/actuator/env'),
  path: '/actuator/env',
  category: 'cve-recon' as const,
  subcategory: 'spring',
};

interface EnvPayload {
  activeProfiles: string[];
  propertySources: Array<{ name: string; properties: Record<string, { value: unknown }> }>;
}

describe('spring-actuator-env', () => {
  it('returns Spring env JSON with masked passwords and example.invalid hosts', async () => {
    const response = springActuatorEnv(ctx);
    expect(response.status).toBe(200);
    const json = (await response.json()) as EnvPayload;
    expect(json.activeProfiles).toEqual(['production']);
    const appConfig = json.propertySources.find((s) => s.name.includes('applicationConfig'));
    expect(appConfig).toBeDefined();
    expect(appConfig?.properties['spring.datasource.password']?.value).toBe('******');
    expect(appConfig?.properties['spring.mail.host']?.value).toContain('example.invalid');
  });
});
