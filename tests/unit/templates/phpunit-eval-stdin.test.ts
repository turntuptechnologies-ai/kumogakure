import { describe, expect, it } from 'vitest';
import { phpunitEvalStdin } from '../../../src/bait/templates/phpunit-eval-stdin.js';

const ctx = (body?: string) => ({
  request: new Request('http://example.test/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php', {
    method: 'POST',
    body,
  }),
  path: '/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
  category: 'cve-recon' as const,
  subcategory: 'phpunit',
  body,
});

describe('phpunit-eval-stdin', () => {
  it('returns an empty 200 (executes nothing)', async () => {
    const response = phpunitEvalStdin(ctx('<?php echo md5("pwned"); ?>'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('never reflects or evaluates the POSTed payload', async () => {
    // md5("pwned") would appear if the payload were executed/echoed.
    const response = phpunitEvalStdin(ctx('<?php echo md5("pwned"); ?>'));
    const text = await response.text();
    expect(text).not.toContain('a6e1a972a0c0fa1bc5d8d9d4f3f3f8a3');
    expect(text).not.toContain('<?php');
  });

  it('emits no canary / tracking headers', () => {
    const response = phpunitEvalStdin(ctx());
    for (const h of ['x-canary', 'x-honeypot', 'x-bait', 'x-trap']) {
      expect(response.headers.get(h)).toBeNull();
    }
  });
});
