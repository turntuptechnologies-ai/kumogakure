import { describe, expect, it } from 'vitest';
import { mcp } from '../../../src/bait/templates/mcp.js';

function ctx(bodyStr: string) {
  return {
    request: new Request('http://example.test/mcp', { method: 'POST', body: bodyStr }),
    path: '/mcp',
    category: 'mcp-recon' as const,
    subcategory: 'mcp',
    body: bodyStr,
  };
}

const init = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-03-26', clientInfo: { name: 'scanner' }, capabilities: {} },
});

describe('mcp template', () => {
  it('answers initialize with a plausible MCP result', async () => {
    const res = mcp(ctx(init));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    const j = (await res.json()) as {
      id: number;
      result: { protocolVersion: string; serverInfo: { name: string }; capabilities: object };
    };
    expect(j.id).toBe(1);
    expect(j.result.protocolVersion).toBe('2025-03-26');
    expect(j.result.serverInfo.name).toBe('ops-mcp-gateway');
    expect(j.result.capabilities).toHaveProperty('tools');
  });

  it('lists enticing fabricated tools', async () => {
    const res = mcp(ctx(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })));
    const j = (await res.json()) as { result: { tools: Array<{ name: string }> } };
    const names = j.result.tools.map((t) => t.name);
    expect(names).toContain('execute_command');
    expect(names).toContain('read_file');
  });

  it('returns fabricated, policy-compliant tools/call output', async () => {
    const res = mcp(
      ctx(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'read_file', arguments: { path: '/etc/passwd' } },
        }),
      ),
    );
    const j = (await res.json()) as {
      result: { content: Array<{ type: string; text: string }>; isError: boolean };
    };
    expect(j.result.isError).toBe(false);
    expect(j.result.content[0]?.type).toBe('text');
    const text = j.result.content[0]?.text ?? '';
    expect(text).toContain('REDACTED_FOR_HONEYPOT');
    expect(text).toContain('EXAMPLE_AKIA');
  });

  it('uses .invalid for fabricated domains', async () => {
    const res = mcp(
      ctx(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { name: 'query_database', arguments: { sql: 'select * from users' } },
        }),
      ),
    );
    const j = (await res.json()) as { result: { content: Array<{ text: string }> } };
    expect(j.result.content[0]?.text).toContain('@example.invalid');
  });

  it('returns JSON-RPC -32601 for an unknown method', async () => {
    const res = mcp(ctx(JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'no/such' })));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { error: { code: number } };
    expect(j.error.code).toBe(-32601);
  });

  it('returns -32700 with HTTP 400 for an unparseable body', async () => {
    const res = mcp(ctx('this is not json'));
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: { code: number } };
    expect(j.error.code).toBe(-32700);
  });

  it('acknowledges notifications with an empty 202', async () => {
    const res = mcp(ctx(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })));
    expect(res.status).toBe(202);
    expect(await res.text()).toBe('');
  });

  it('emits no honeypot canary header', () => {
    const res = mcp(ctx(init));
    for (const [k] of res.headers.entries()) {
      expect(k.toLowerCase()).not.toContain('honeypot');
    }
  });
});
