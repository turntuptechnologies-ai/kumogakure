import { describe, expect, it } from 'vitest';
import { springActuatorGeneric } from '../../../src/bait/templates/spring-actuator-generic.js';

describe('spring-actuator-generic', () => {
  it('returns Spring-style 404 JSON including the request path', async () => {
    const response = springActuatorGeneric({
      request: new Request('http://example.test/actuator/beans'),
      path: '/actuator/beans',
      category: 'cve-recon',
      subcategory: 'spring',
    });
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { status: number; error: string; path: string };
    expect(json.status).toBe(404);
    expect(json.error).toBe('Not Found');
    expect(json.path).toBe('/actuator/beans');
  });
});
