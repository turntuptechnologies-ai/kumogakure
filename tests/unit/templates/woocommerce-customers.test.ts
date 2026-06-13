import { describe, expect, it } from 'vitest';
import { woocommerceCustomers } from '../../../src/bait/templates/woocommerce-customers.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'woocommerce',
});

describe('woocommerce-customers', () => {
  it('returns the authentic 401 woocommerce_rest_cannot_view body (no customer leaked)', async () => {
    const response = woocommerceCustomers(ctx('/wp-json/wc/v3/customers'));
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    const json = (await response.json()) as { code: string; data: { status: number } };
    expect(json.code).toBe('woocommerce_rest_cannot_view');
    expect(json.data.status).toBe(401);
  });

  it('leaks no customer/email fields', async () => {
    const text = await woocommerceCustomers(ctx('/wp-json/wc/v3/customers')).text();
    expect(text).not.toMatch(/email|first_name|billing/i);
  });

  it('emits no canary / tracking headers', () => {
    const response = woocommerceCustomers(ctx('/wp-json/wc/v3/customers'));
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
